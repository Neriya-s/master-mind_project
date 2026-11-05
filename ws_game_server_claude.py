"""
שרת WebSocket למשחק בול פגיעה בין שני שחקנים.
הקוד הסודי נוצר ונשמר רק בשרת - השחקנים לעולם לא מקבלים אותו (עד סוף המשחק). # נוסף

התקנה:   pip install websockets
הרצה:    py ws_game_server_claude.py   (מאזין ב-ws://localhost:8765)
         נוסף: השרת מגיש גם את דף המשחק - הקבצים (HTML, JS, תמונות) צריכים להיות באותה תיקייה של הקובץ הזה.
         נוסף: במחשב אחר ברשת פותחים רק את הכתובת שמודפסת בהרצה (http://<IP>:8000) - בלי שם קובץ.

לקוח -> שרת
  {"type": "login", "username": "dan", "password": "1234"}   # שם חדש נרשם אוטומטית
  {"type": "find_match", "settings": {"code_length": 4, "num_tries": 10, "number_colors": 8, "allow_duplicates": false}}   # נוסף: עכשיו שולחים גם הגדרות
  {"type": "move", "move": [3, 1, 4, 2]}
  {"type": "leave"}

שרת -> לקוח
  {"type": "auth_ok", "username": "dan"}
  {"type": "waiting"}
  {"type": "match_start", "opponent": "ron", "your_turn": true, "settings": {...}}   # נוסף: ההגדרות של המשחק (של השחקן שמתחיל)
  {"type": "move_ok", "your_turn": false, "bulls": 1, "bullseyes": 2}   # נוסף: התשובה של השרת לניחוש שלי
  {"type": "opponent_move", "move": [3, 1, 4, 2], "your_turn": true, "bulls": 1, "bullseyes": 2}   # נוסף: הניחוש של היריב והתשובה עליו (your_turn=false אם המשחק נגמר)
  {"type": "game_over", "result": "win", "color": "blue", "code": [..], "reason": "..."}   # נוסף: סוף משחק - רק כאן נחשף הקוד (win / lose / drew)
  {"type": "left"}
  {"type": "error", "message": "..."}
"""

import asyncio
import json
import os
import random
import socket  # נוסף: כדי למצוא את כתובת ה-IP של המחשב ברשת
import threading  # נוסף: כדי להריץ את שרת הקבצים במקביל לשרת ה-WebSocket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer  # נוסף: שרת קבצים פשוט שמגיש את דף המשחק

try:  # נוסף: מנסה לטעון את הספרייה websockets
    import websockets
except ImportError:  # נוסף: אם הספרייה לא מותקנת
    raise SystemExit("חסרה הספרייה websockets. להתקנה הרץ:  pip install websockets")  # נוסף: הודעה ברורה במקום שגיאה מבלבלת

HOST = ""      # נוסף: מחרוזת ריקה = מאזין לכל כתובות המחשב (גם localhost וגם הרשת)
PORT = 8765
HTTP_PORT = 8000  # נוסף: הפורט שבו מוגש דף המשחק
GAME_PAGE = "HTML_Bullseye_project_claude.html"  # נוסף: קובץ המשחק שמוגש בכתובת הראשית (/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # נוסף: התיקייה שבה נמצאים קבצי המשחק (ליד קובץ השרת)
USERS_FILE = "users.json"

users = {}              # username -> password
if os.path.exists(USERS_FILE):
    with open(USERS_FILE, encoding="utf-8") as f:
        users = json.load(f)

waiting = None          # שחקן שמחכה ליריב


# ---------- לוגיקת המשחק (נוסף - עד עכשיו היא הייתה בלקוח) ----------

def clean_settings(raw):  # נוסף: בודקת שההגדרות שהלקוח שלח חוקיות (מחזירה None אם לא)
    try:  # נוסף: מנסה לקרוא את כל השדות
        s = {  # נוסף: בונה אובייקט הגדרות נקי
            "code_length": int(raw["code_length"]),  # נוסף: אורך הקוד
            "num_tries": int(raw["num_tries"]),  # נוסף: מספר ניסיונות
            "number_colors": int(raw["number_colors"]),  # נוסף: מספר צבעים
            "allow_duplicates": bool(raw["allow_duplicates"]),  # נוסף: האם מותר לחזור על צבע
        }  # נוסף: סוף האובייקט
    except (KeyError, TypeError, ValueError):  # נוסף: שדה חסר או ערך לא מספרי
        return None  # נוסף: הגדרות לא חוקיות
    if not (1 <= s["code_length"] <= 8 and 1 <= s["num_tries"] <= 20 and 1 <= s["number_colors"] <= 10):  # נוסף: אותם טווחים כמו הסליידרים
        return None  # נוסף: מחוץ לטווח
    if not s["allow_duplicates"] and s["code_length"] > s["number_colors"]:  # נוסף: בלי כפילויות צריך לפחות מספיק צבעים
        return None  # נוסף: אין מספיק צבעים
    return s  # נוסף: ההגדרות תקינות


def make_code(s):  # נוסף: מגרילה קוד סודי לפי ההגדרות
    if s["allow_duplicates"]:  # נוסף: מותר לחזור על צבע
        return [random.randrange(s["number_colors"]) for _ in range(s["code_length"])]  # נוסף: כל מקום מוגרל בנפרד
    return random.sample(range(s["number_colors"]), s["code_length"])  # נוסף: בלי כפילויות


def count_bull(code, guess):  # נוסף: כמה צבעים נכונים במקום לא נכון (זהה ל-count_bull שהיה ב-JS)
    temp = list(code)  # נוסף: עותק כדי לסמן צבעים שכבר נספרו
    bull = 0  # נוסף: המונה
    for i in range(len(code)):  # נוסף: עובר על כל מקום בניחוש
        if temp[i] != guess[i]:  # נוסף: מדלגים על מקומות שפגעו בדיוק
            for w in range(len(code)):  # נוסף: מחפש את הצבע בשאר הקוד
                if temp[w] == guess[i] and temp[w] != guess[w]:  # נוסף: צבע נכון במקום שלא נוחש נכון
                    bull += 1  # נוסף: סופר
                    temp[w] = None  # נוסף: מסמן שהצבע הזה כבר נספר
                    break  # נוסף: עוברים למקום הבא בניחוש
    return bull  # נוסף: מחזיר את הספירה


def count_bullseye(code, guess):  # נוסף: כמה צבעים במקום המדויק (זהה ל-count_bullseye שהיה ב-JS)
    return sum(1 for i in range(len(code)) if code[i] == guess[i])  # נוסף: סופר מקומות שווים


def valid_move(move, s):  # נוסף: בודקת שהניחוש הוא מערך תקין לפי ההגדרות
    if not isinstance(move, list) or len(move) != s["code_length"]:  # נוסף: חייב להיות מערך באורך הקוד
        return False  # נוסף: לא תקין
    return all(isinstance(x, int) and not isinstance(x, bool) and 0 <= x < s["number_colors"] for x in move)  # נוסף: כל איבר הוא מספר צבע חוקי


def game_results(game):  # נוסף: בודקת אם המשחק נגמר ומחזירה תוצאה לכל שחקן (או None אם ממשיכים)
    if game.moves[0] != game.moves[1]:  # נוסף: הסיבוב עוד לא נגמר - אחד השחקנים עוד לא שיחק
        return None  # נוסף: ממשיכים
    a, b = game.solved  # נוסף: מי ניחש את הקוד
    if a and b:  # נוסף: שניים ניחשו באותו סיבוב
        return [("drew", "blue"), ("drew", "blue")]  # נוסף: תיקו
    if a:  # נוסף: רק שחקן 0 ניחש
        return [("win", "blue"), ("lose", "red")]  # נוסף: הוא מנצח
    if b:  # נוסף: רק שחקן 1 ניחש
        return [("lose", "red"), ("win", "blue")]  # נוסף: הוא מנצח
    if game.moves[0] == game.settings["num_tries"]:  # נוסף: נגמרו הניסיונות ואף אחד לא ניחש
        return [("drew", "red"), ("drew", "red")]  # נוסף: תיקו
    return None  # נוסף: ממשיכים


class Player:
    def __init__(self, ws):
        self.ws = ws
        self.name = None
        self.game = None
        self.idx = None
        self.settings = None  # נוסף: ההגדרות שהשחקן ביקש (נשלחות עם find_match)


class Game:
    def __init__(self, p1, p2):
        self.players = [p1, p2]
        self.turn = random.randint(0, 1)   # אינדקס השחקן שמתחיל
        self.settings = self.players[self.turn].settings  # נוסף: משתמשים בהגדרות של השחקן שמתחיל
        self.code = make_code(self.settings)  # נוסף: הקוד הסודי - נשמר רק בשרת
        self.moves = [0, 0]  # נוסף: כמה ניחושים כל שחקן שלח
        self.solved = [False, False]  # נוסף: מי כבר ניחש את הקוד
        self.over = False  # נוסף: האם המשחק נגמר


async def send(player, **data):
    try:
        await player.ws.send(json.dumps(data, ensure_ascii=False))
    except websockets.ConnectionClosed:
        pass


async def end_game(player):
    game = player.game
    if not game:
        return
    opponent = game.players[1 - player.idx]
    for p in game.players:
        p.game = p.idx = None
    if not game.over:  # נוסף: אם המשחק עוד לא נגמר - היריב ניצח בגלל עזיבה
        await send(opponent, type="game_over", result="win", color="blue", code=game.code, reason="opponent_left")  # נוסף: מודיע ליריב שניצח וחושף את הקוד


async def do_login(p, msg):
    name = str(msg.get("username", "")).strip()
    password = str(msg.get("password", ""))
    if not name:
        return await send(p, type="error", message="חסר שם משתמש")
    if name not in users:
        users[name] = password
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    elif users[name] != password:
        return await send(p, type="error", message="סיסמה שגויה")
    p.name = name
    await send(p, type="auth_ok", username=name)


async def do_find_match(p, msg):  # נוסף: מקבלת גם את ההודעה כדי לקרוא ממנה את ההגדרות
    global waiting
    settings = clean_settings(msg.get("settings"))  # נוסף: בודק את ההגדרות שהלקוח שלח
    if not settings:  # נוסף: הגדרות לא חוקיות
        return await send(p, type="error", message="הגדרות משחק לא חוקיות")  # נוסף: מחזיר שגיאה
    p.settings = settings  # נוסף: שומר את ההגדרות של השחקן
    if p.game:
        return await send(p, type="error", message="אתה כבר במשחק")
    if waiting is None or waiting is p:
        waiting = p
        return await send(p, type="waiting")

    opponent, waiting = waiting, None
    game = Game(opponent, p)
    print(f"New game: {opponent.name} vs {p.name} | code: {game.code} | settings: {game.settings}")  # נוסף: מדפיס בטרמינל של השרת מי נגד מי ומה הקוד
    
    for i, player in enumerate(game.players):
        player.game, player.idx = game, i
    for player in game.players:
        other = game.players[1 - player.idx]
        await send(player, type="match_start", opponent=other.name,
                   your_turn=(game.turn == player.idx),
                   settings=game.settings)  # נוסף: שולח את ההגדרות (הקוד לא נשלח)


async def do_move(p, msg):
    game = p.game
    if not game:
        return await send(p, type="error", message="אתה לא במשחק")
    if game.over:  # נוסף: אחרי שהמשחק נגמר אי אפשר לשחק
        return await send(p, type="error", message="המשחק נגמר")  # נוסף: מחזיר שגיאה
    if game.turn != p.idx:
        return await send(p, type="error", message="זה לא התור שלך")
    move = msg.get("move")
    if not valid_move(move, game.settings):  # נוסף: השרת בודק שהניחוש תקין
        return await send(p, type="error", message="ניחוש לא תקין")  # נוסף: מחזיר שגיאה

    bulls = count_bull(game.code, move)  # נוסף: השרת מחשב כמה "בול"
    bullseyes = count_bullseye(game.code, move)  # נוסף: השרת מחשב כמה "בול פגיעה"
    game.moves[p.idx] += 1  # נוסף: סופר את הניחוש
    if bullseyes == game.settings["code_length"]:  # נוסף: אם פגע בכל המקומות
        game.solved[p.idx] = True  # נוסף: השחקן ניחש את הקוד
    results = game_results(game)  # נוסף: בודק אם המשחק נגמר

    game.turn = 1 - p.idx
    opponent = game.players[game.turn]
    await send(p, type="move_ok", your_turn=False, bulls=bulls, bullseyes=bullseyes)  # נוסף: שולח לשחקן את התשובה של השרת
    await send(opponent, type="opponent_move", move=move, your_turn=(results is None),
               bulls=bulls, bullseyes=bullseyes)  # נוסף: שולח ליריב את הניחוש והתשובה (אין תור אם המשחק נגמר)
    if results:  # נוסף: המשחק נגמר
        game.over = True  # נוסף: מסמן שנגמר
        for player, (result, color) in zip(game.players, results):  # נוסף: עובר על שני השחקנים
            await send(player, type="game_over", result=result, color=color, code=game.code)  # נוסף: שולח לכל אחד את התוצאה ואת הקוד


async def do_leave(p):
    global waiting
    if waiting is p:
        waiting = None
    await end_game(p)
    await send(p, type="left")


async def handler(ws, path=None):  # נוסף: path=None כדי שיעבוד גם עם גרסאות ישנות של websockets (שמעבירות פרמטר שני)
    global waiting
    p = Player(ws)
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
                kind = msg["type"]
            except (ValueError, KeyError, TypeError):
                await send(p, type="error", message="הודעה לא תקינה")
                continue

            if kind == "login" and not p.name:
                await do_login(p, msg)
            elif not p.name:
                await send(p, type="error", message="צריך להתחבר קודם")
            elif kind == "find_match":
                await do_find_match(p, msg)  # נוסף: מעביר גם את ההודעה (מכילה את ההגדרות)
            elif kind == "move":
                await do_move(p, msg)
            elif kind == "leave":
                await do_leave(p)
            else:
                await send(p, type="error", message=f"פעולה לא מוכרת: {kind}")
    except websockets.ConnectionClosed:
        pass
    finally:
        if waiting is p:
            waiting = None
        await end_game(p)


class GameFilesHandler(SimpleHTTPRequestHandler):  # נוסף: מגיש את קבצי המשחק לדפדפן
    def __init__(self, *args, **kwargs):  # נוסף: בנאי
        super().__init__(*args, directory=BASE_DIR, **kwargs)  # נוסף: מגיש קבצים מתיקיית המשחק

    def translate_path(self, path):  # נוסף: ממירה כתובת בדפדפן לקובץ בדיסק
        if path.split("?")[0] in ("/", ""):  # נוסף: אם פתחו את הכתובת הראשית בלי שם קובץ
            path = "/" + GAME_PAGE  # נוסף: מגישים את דף המשחק
        return super().translate_path(path)  # נוסף: כל שאר הכתובות (JS, תמונות) כרגיל

    def log_message(self, *args):  # נוסף: בלי הדפסת לוג על כל בקשה
        pass  # נוסף: מדלג


def lan_ip():  # נוסף: מחזירה את כתובת ה-IP של המחשב ברשת המקומית
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # נוסף: שקע UDP (לא נשלח מידע בפועל)
    try:  # נוסף: מנסה
        s.connect(("10.255.255.255", 1))  # נוסף: "מתחבר" לכתובת כלשהי כדי שהמערכת תבחר את הכרטיס הרשת
        return s.getsockname()[0]  # נוסף: הכתובת של המחשב שלנו
    except OSError:  # נוסף: אין רשת
        return "127.0.0.1"  # נוסף: ברירת מחדל
    finally:  # נוסף: תמיד
        s.close()  # נוסף: סוגר את השקע


def start_http():  # נוסף: מפעילה את שרת הקבצים ברקע
    try:  # נוסף: מנסה לפתוח את הפורט
        server = ThreadingHTTPServer((HOST, HTTP_PORT), GameFilesHandler)  # נוסף: יוצר את שרת הקבצים
    except OSError:  # נוסף: הפורט תפוס
        raise SystemExit(f"פורט {HTTP_PORT} תפוס - אולי עדיין רץ py -m http.server? סגור אותו ונסה שוב")  # נוסף: הודעה ברורה
    threading.Thread(target=server.serve_forever, daemon=True).start()  # נוסף: מריץ ברקע


async def main():
    start_http()  # נוסף: מפעיל את שרת הקבצים
    async with websockets.serve(handler, HOST, PORT):
        print(f"דף המשחק:   http://{lan_ip()}:{HTTP_PORT}   (את הכתובת הזו פותחים במחשבים אחרים; אצלך גם http://localhost:{HTTP_PORT})")  # נוסף: הכתובת לפתיחה בדפדפן
        print(f"WebSocket:  ws://{lan_ip()}:{PORT}")  # נוסף: כתובת השרת (המשחק מתחבר אליה אוטומטית)
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nהשרת נסגר")
