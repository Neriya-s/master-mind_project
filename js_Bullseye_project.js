
const title_div = document.getElementById("title");
const input_div = document.getElementById("input");
const start_button_div = document.getElementById("start_button_container");
const container_div = document.getElementById("container");
const the_code_div = document.getElementById("the_code")
const back_button_div = document.getElementById("back_button");
const end_overlay_div = document.getElementById("end_overlay");
const end_overlay_main_div = document.getElementById("end_overlay_main");

const duplicates_checkbox = document.getElementById("allow_duplicates_checkbox")
const tries_slide = document.getElementById("tries_range")
const length_slide = document.getElementById("length_range")
const number_colors_slide = document.getElementById("number_colors_range")


let code_length = Number(length_slide.value);
let num_tries = Number(tries_slide.value);
let number_colors = Number(number_colors_slide.value);
let allow_duplicates = false;
let array_bord;
let color = ["red", "orange", "yellow", "green", "blue", "cyan", "purple", "rgb(255,125,125)", "#7f3f00", "white"];
let array_code;
let temp_code;
let array_guess;
let try_counter = 0;
let color_selected_num = 0;
let idnum = 0;
let is_bot_mode = false;
let is_competition = false;////////


const WS_URL = "ws://" + (location.hostname || "localhost") + ":8765"; // נוסף: כתובת שרת ה-WebSocket - נלקחת מהכתובת שממנה נטען הדף (וב-localhost כשפותחים את הקובץ ישירות)
const online_container_div = document.getElementById("online_container"); // נוסף: מסך ההתחברות וההמתנה ליריב
const online_status_div = document.getElementById("online_status"); // נוסף: שורת ההודעות במסך ההתחברות
const online_turn_div = document.getElementById("online_turn"); // נוסף: חיווי התור הקבוע בזמן המשחק
const online_go_button = document.getElementById("online_go_button"); // נוסף: כפתור login / find opponent
let is_online_mode = false; // נוסף: האם אנחנו במצב אונליין
let ws = null; // נוסף: חיבור ה-WebSocket לשרת (null כשאין חיבור)
let online_logged_in = false; // נוסף: האם כבר התחברנו עם שם משתמש וסיסמה
let online_my_turn = false; // נוסף: האם עכשיו התור שלי
let online_opponent_name = ""; // נוסף: שם היריב
let online_my_settings = null; // נוסף: ההגדרות שלי (נשלחות לשרת; אם אני מתחיל - משתמשים בהן)

function update_slider_display(range,display_num) {
    display_num.innerHTML = range.value;
}
function build_home() {
    online_exit(); // נוסף: אם היינו במצב אונליין - עוזבים את המשחק ומסתירים את מסך האונליין

    title_div.style.display = "";
    start_button_div.style.display = "";
    settings_container.style.display = "";

    back_button_div.style.display = "none";
    the_code_div.innerHTML = "";
    input_div.innerHTML = "";
    input_div.style.display = "none";
    container_div.innerHTML = "";//מוחק את הלוח הקודם
    container_div.style.display = "none";

}


function build_bord() {

    code_length = Number(length_slide.value);
    num_tries = Number(tries_slide.value);
    number_colors = Number(number_colors_slide.value);
    allow_duplicates = duplicates_checkbox.checked;

    is_bot_mode = false;
    is_competition = true;

    if (!allow_duplicates && code_length > number_colors) {
        show_error("Not enough colors to fill the code")
        return;
    }

    try_counter = 0;

    temp_code = new Array(code_length);

    //מגלה את כפתור החזור
    back_button_div.style.display = "";

    //יוצר מערך ללוח המשחק

    array_bord = new Array(num_tries);//מגדיר מערך לגודל המשחק

    for (let r = 0; r < array_bord.length; r++) {
        array_bord[r] = new Array(code_length)
        for (let c = 0; c < array_bord[r].length; c++) {
            array_bord[r][c] = null;
        }
    }

    container_div.innerHTML = "";//מוחק את הלוח הקודם
    //יוצר את הכפתורים ללוח המשחק
    for (let i = 0; i < num_tries; i++) {
        create_row(i);
    }
    container_div.style.display = "";

    //יוצר מערך לקוד
    array_code = new Array(code_length);

    // בחירה אם הקוד יהיה רנדומלי או ידני על ידי כפתורים
    let choose = "<button onclick='choose_random()' class='random_button'>";
    choose += "random";
    choose += "</button>";
    choose += "<button onclick='manual_code()' class='manual_button'>";
    choose += "manual";
    choose += "</button>";
    the_code_div.innerHTML = choose;


    //מוחק את הכותרת הכפתור וההגדרות
    title_div.style.display = "none";
    start_button_div.style.display = "none";
    settings_container.style.display = "none";

    //יוצר את בחירת הצבע
    create_color_selection(number_colors);
    input_div.style = "";

    set_color(0, document.getElementById("10000"));
}

//מקבל מספר ויוצר את השורה של המספר
function create_row(row_num) {

    let button_color = "<div id='row" + row_num + "' class='row_container'>";

    //יוצר את הכפתורים לתשובות
    button_color += create_row_answers(row_num,false);

    //יוצר את הכפתורים ללוח המשחק
    button_color += create_row_guesses(row_num,false);

    //יוצר את הכפתור להגשה
    button_color += create_row_submit(row_num,false);

    button_color += "</div>";//לסגור את הדיב שמכיל את השורה

    container_div.innerHTML += button_color;

}

//יוצר את הכפתורים לתשובות
function create_row_answers(row_num,is_bot_row) {

    let answer_buttons = "";

    if (is_bot_row)
        idnum = 20000 + (row_num * code_length);
    else
        idnum = 1000 + (row_num * code_length);

    answer_buttons += "<div id='row_answers" + row_num + "' class='row_answers'>";
    if (row_num < 9)//מוסיף תווים בלתי נראה כדאי שהשורות יהיו מסודרות
        answer_buttons += "<span>\u00A0\u00A0</span>";
    answer_buttons += (row_num + 1);
    answer_buttons += ".";

    for (let i = 0; i < code_length; i++) {
        answer_buttons += "<button id='" + idnum.toString() + "'; class='button_answer'>";
        answer_buttons += "</button>";

        if (i == Math.ceil(code_length / 2)-1)
            answer_buttons += "<br />";

        idnum++;
    }
        answer_buttons += "</div>";

    return answer_buttons
}

//יוצר את הכפתורים ללוח המשחק
function create_row_guesses(row_num, is_bot_row) {

    let guess_buttons = "";

    if (is_bot_row)
        idnum = 30000 + (row_num * code_length);
    else
        idnum = (row_num * code_length);

    guess_buttons += "<div id='row_guesses" + row_num + "' class='row_guesses'>";
    if (row_num < 9)//מוסיף תווים בלתי נראה כדאי שהשורות יהיו מסודרות
        guess_buttons += "<span>\u00A0\u00A0</span>";
    guess_buttons += (row_num + 1);
    guess_buttons += ".";


    for (let c = 0; c < code_length; c++) {
        if(is_competition)
            guess_buttons += "<button id='" + idnum.toString() + "'onclick='change_array(this)'; class='button_color_disabled' disabled>";
        else
            guess_buttons += "<button id='" + idnum.toString() + "'onclick='change_array(this)'; class='the_code' disabled>";

        guess_buttons += " ";
        guess_buttons += "</button>";
        idnum++;
    }
    if (is_bot_row)
        guess_buttons += "</div>";

    return guess_buttons
}

function create_row_submit(row_num,is_bot_only) {

    let submit_button = "";

    idnum = 500 + row_num;

     if(!is_bot_only)
        submit_button += "<button id='" + idnum.toString() + "' onclick='submit(this)' class='button_submit_disabled' disabled>";
    else
         submit_button += "<button id='" + idnum.toString() + "' onclick='submit_bot(this)' class='button_submit' disabled>";

    submit_button += "submit";
    submit_button += "</button>";
    submit_button += "</div>";//לסגור את הדיב של הכפתור של ההגשה וכפתורי הניחוש


    return submit_button;
}

function create_color_selection(number_of_colors) {
    let color_pick = "";
    if (is_competition)
        color_pick = "<button id='10000' onclick='set_color(0,this)' class='selected_color' style='background-color: red;' >";
    else
        color_pick = "<button id='10000' class='select_color' style='background-color: red;' >";

    for (let i = 1; i < number_of_colors; i++) {
        color_pick += "<button id='"+(10000+i)+"' onclick='set_color("+i+",this)' class='select_color' style='background-color: "+color[i]+";' >";
    }
    input_div.innerHTML = color_pick;
}

function disable_color_selection(number_of_colors) {
    for (i = 0; i < number_of_colors; i++)
        document.getElementById(10000 + i).style.pointerEvents = "none";
}

//משנה את צבע הכפתור לפי המספר שהמשתמש בוחר
let corrant_button = "10000";
let pre_button = "10000";
function set_color(num_select, selected_button) {
    color_selected_num = num_select;
    corrant_button = selected_button.id;
    let this_id = corrant_button;
    if (pre_button != corrant_button) {
        document.getElementById(pre_button).className = "select_color";
        document.getElementById(this_id).className = "selected_color";
        pre_button = this_id;
    }
}

//משנה את מערך לוח המשחק בכל פעם שלוחצים על כפתור ניחוש(שחור)
function change_array(button) {
    let co = color_selected_num;
    document.getElementById(button.id).style.backgroundColor = color[co];
    document.getElementById(button.id).style.border = "2px solid black";

    // let r = Math.floor(button.id / code_length);//איזה שורה/איפה בטור
    let c = button.id % code_length;//איזה טור/איפה בשורה

    array_bord[try_counter][c] = co;
}

//מקבל מערך נכון ומערך של ניחוש ומחזיר כמה "בול" יש
function count_bull(arr_code_org,arr_code_guess) {

    let temp_bull_code = new Array(code_length);
    for (let i = 0; i < arr_code_org.length; i++) {
        temp_bull_code[i] = arr_code_org[i];
    }

    let bull = 0;
    for (let i = 0; i < code_length; i++) {
        if (temp_bull_code[i] != arr_code_guess[i]) {
            for (let w = 0; w < code_length; w++) {
                if (temp_bull_code[w] == arr_code_guess[i] &&
                    temp_bull_code[w] != arr_code_guess[w]) {
                    bull++;
                    temp_bull_code[w] = null;
                    break;
                }
            }
        }
    }
    return bull;
}

//מקבל מערך נכון ומערך של ניחוש ומחזיר כמה "בול פגיעה" יש
function count_bullseye(arr_code_org, arr_code_guess) {

    let bullseye = 0;
    for (let i = 0; i < code_length; i++) {
        if (arr_code_org[i] == arr_code_guess[i]) {
            bullseye++;
        }
    }
    return bullseye;
}


function submit(button_submit) {
    let submit_id = Number(button_submit.id);
    let try_num = submit_id - 500;

    if (is_array_full(array_bord[try_num])) {//בודק אם המשתמש מילא את כל הקוד
        if (is_online_mode) { // נוסף: במצב אונליין הקוד נמצא רק בשרת, לכן לא מחשבים תשובה כאן
            online_my_move(try_num); // נוסף: שולח את הניחוש לשרת (התשובה תגיע ממנו)
            return; // נוסף: מדלגים על שאר הקוד של submit שמחשב תשובות מקומית
        } // נוסף: סוף ה-if של מצב אונליין

        let bull = count_bull(array_code, array_bord[try_num])
        let bullseye = count_bullseye(array_code, array_bord[try_num])

        disable_row(try_num);//מבטל את השורה הנוכחית

        //משנה את הצבע של הכפתורים של התשובות לפי "בול" ו"בול פגיעה"
        let first = 1000 + code_length * try_num;
        fill_answers(first, bull, bullseye);


        if (is_bot_mode)
            bot_turn();

        if (!is_end(bullseye))
            activate_row(try_num + 1);//מפעיל את השורה הבאה
        else if (is_bot_mode)
            reveal_moves();

        try_counter++;
    }
}

//משנה את הצבע של הכפתורים של התשובות לפי "בול" ו"בול פגיעה"
function fill_answers(first_id, bulls, bullseyes) {

    for (let i = 0; i < code_length; i++) {
        let button_answer_id = first_id + i;
        let button_answer = document.getElementById(button_answer_id);
        if (bullseyes > 0) {
            button_answer.style.backgroundColor = "red";
            bullseyes--;
        }
        else {
            if (bulls > 0) {
                button_answer.style.backgroundColor = "yellow";
                bulls--;
            }
        }
    }
}

function is_end(bullseye) {

    if (bullseye == code_length && count_bullseye(array_code, currrent_guess_array) == code_length) {
        end_screen("drew", "blue");
        return true;
    }
    if (try_counter == num_tries - 1) {
        if (bullseye < code_length && count_bullseye(array_code, currrent_guess_array) < code_length) {
            end_screen("drew", "red");
            return true;
        }
        if (bullseye == code_length) {
            end_screen("win", "blue");
            return true;
        }
        end_screen("lose", "red");
        return true;
    }
    if (bullseye == code_length) {
        end_screen("win", "blue");
        return true;
    }
    if (count_bullseye(array_code, currrent_guess_array) == code_length) {
        end_screen("lose", "red");
        return true;
    }
    return false;
}
function end_screen(result, end_color) {

    if (is_competition)
        reveal_code(200, array_code);

    let the_result = "you " + result + "!";
    let the_fanction = "";

    if (is_bot_mode) {
        if (!is_competition)
            the_result = "the bot " + result.slice(4);

        the_fanction = "create_bot_array() , bot_build_bord(" + is_competition + ")";
    }
    else if (is_online_mode)  // נוסף: במצב אונליין כפתור play again מחפש יריב חדש
        the_fanction = "online_play_again()";
    else
        the_fanction = "build_bord()";

    input_div.innerHTML = the_result + "<button class='button_play_again' onclick='" + the_fanction + "'>play again?</button > ";

    if (result == "bot_win")
        end_overlay_main_div.innerHTML = "bot <br />win!";
    else if (result == "bot_lose")
        end_overlay_main_div.innerHTML = "bot <br />lose!";
    else
        end_overlay_main_div.innerHTML = "you <br />" + result + "!";

    end_overlay_main_div.style.color = end_color;

    end_overlay_div.style.display = "block";
}
function hide() {
    end_overlay_div.style.display = "none";
}

function choose_random() {//
    if (allow_duplicates)
        random_code_duplicates();
    else
        random_code_unique();

    //מפעיל את השורה הראשונה
    if (is_competition)
        activate_row(0);
}

function random_code_unique() {
    //יוצר מערך של האינדקסים של הצבעים
    let num_for_colors = new Array(number_colors);
    for (let i = 0; i < num_for_colors.length; i++) {
        num_for_colors[i] = i;
    }
    //מערבב את המערך
    scramble_array(num_for_colors);

    //משווה את הקוד לספרות הראשונות של המערך המעורבב
    for (let i = 0; i < code_length; i++) {
        array_code[i] = num_for_colors[i];
    }

    //יוצר ייצוג של הקוד
    create_code_template()

    //console.log(array_code)
}

function random_code_duplicates() {
    //מגדיר קוד רנדומלי במערך

    let color_code_num;
    for (let i = 0; i < code_length; i++) {
        color_code_num = random_int(0,number_colors-1);
        array_code[i] = color_code_num;
    }

    //יוצר ייצוג של הקוד
    create_code_template()

    //console.log(array_code)
}

function manual_code() {

    //יוצר כפתור שהמשתמש מזין בו את הקוד
    idnum = 200;
    let button_color_code = "enter code:";
    for (let c = 0; c < code_length; c++) {
        button_color_code = button_color_code + "<button id='" + idnum.toString() + "'onclick='manual_color_pick(this)' class='the_code_manual'>";
        button_color_code = button_color_code + "";
        button_color_code = button_color_code + "</button>";
        idnum++;
    }
    button_color_code = button_color_code + "<button id='" + idnum.toString() + "' onclick='manual_color_pick_submit()' class='submit_code'>";
    button_color_code = button_color_code + "submit code";
    button_color_code = button_color_code + "</button>";
    the_code_div.innerHTML = button_color_code;

}

function manual_color_pick(button_code) {

    let co = color_selected_num;
    document.getElementById(button_code.id).style.backgroundColor = color[co];
    document.getElementById(button_code.id).style.border = "2px solid black";
    ///
    let button_index = button_code.id - 200;
    button_index = Number(button_index);
    temp_code[button_index] = co
    ///
}

function manual_color_pick_submit() {

    if (is_array_full(temp_code) && (allow_duplicates || is_unique_array(temp_code))) {

        for (let i = 0; i < code_length; i++) {
            array_code[i] = temp_code[i]
        }

        //יוצר תצוגה של אורך הקוד
        create_code_template();

        //מפעיל את השורה הראשונה
        activate_row(0)

        set_color(0, document.getElementById("10000"));

        //console.log(array_code)
    }
    else
        show_error("cannot use duplicates with current settings");
}


//////////////////////////////////////////
//////////////////////////////////////////

//מערבב מערך
function scramble_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

//מחזיר מספר שלם בין מינימום למקסימום כולל הקצוות
function random_int(min,max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//בודק אם מערך מלא
function is_array_full(array_to_check) {
    for (let i = 0; i < array_to_check.length; i++) {
        if (array_to_check[i] == null)
            return false;
    }
    return true;
}

//מפעיל שורה של ניחוש
function activate_row(num_of_row) {
    let current_submit = document.getElementById(500 + num_of_row);
    current_submit.className = "button_submit";
    current_submit.disabled = false;

    let current_button_id = code_length * num_of_row;

    let button_disable = "";

    for (let i = 0; i < code_length; i++) {
        current_button = current_button_id + i;
        button_disable = document.getElementById(current_button);

        button_disable.className = "button_color";
        button_disable.style.cursor = "default";
        button_disable.disabled = false;
    }
}

//מבטל שורה של ניחוש
function disable_row(num_of_row) {
    let current_submit = document.getElementById(500 + num_of_row);
    current_submit.className = "button_submit_disabled";
    current_submit.disabled = true;

    let current_button_id = code_length * num_of_row;

    let button_disable = "";

    for (let i = 0; i < code_length; i++) {
        current_button = current_button_id + i;
        button_disable = document.getElementById(current_button);

        button_disable.className = "button_color_used";
        button_disable.disabled = true;
    }
}

//יוצר תצוגה של אורך הקוד
function create_code_template() {
    idnum = 200;
    let button_color_code = "the code:";
    for (let c = 0; c < code_length; c++) {
        button_color_code = button_color_code + "<button id='" + idnum.toString() + "'; class='the_code'>";
        button_color_code = button_color_code + "?";
        button_color_code = button_color_code + "</button>";
        idnum++;
    }
    the_code_div.innerHTML = button_color_code;
}

//מציג את הקוד הנכון
function reveal_code(start_id,array) {
    for (let i = 0; i < array.length; i++) {
        let code_id = i + start_id;
        code_button = document.getElementById(code_id);
        code_button.innerHTML = "";
        code_button.style.backgroundColor = color[array[i]]
    }
}

function is_unique_array(array) {

    let index_array = new Array(number_colors).fill(1);
    for (let i = 0; i < array.length; i++) {
        if (index_array[array[i]] == 0)
            return false;
        index_array[array[i]] = 0;
    }
    return true;
}

function hide_guesses(row_num) {

    idnum = 30000
    for (let i = 0; i < code_length; i++) {
        current_hidden_guess_id = idnum + (code_length * row_num) + i;
        current_hidden_guess = document.getElementById(current_hidden_guess_id);
        current_hidden_guess.className = "the_code";
        current_hidden_guess.innerHTML = "?";
    }
}

function show_error(error_string) {
    alert(error_string);
    console.error(error_string);
}

///////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//////////////bot/////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////bot//////////////////
////////////////////////////////////bot///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
/////////////////////////bot//////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////bot////////////
//////////////////////////////////////////////////////////////////////

let bot_array

let num_color_bot;//(n <= 9) for dup// בכמה צבעים שונים הבוט יכול להשתמש
// code_length <= 7 for dup// מה אורך הקוד
let bot_moves_array;

let bulls_bot;
let bullseyes_bot;


function choose_bot() {

    code_length = Number(length_slide.value);
    num_tries = Number(tries_slide.value);
    number_colors = Number(number_colors_slide.value);
    allow_duplicates = duplicates_checkbox.checked;

    num_color_bot = number_colors;

    create_bot_array();

    //מגלה את כפתור החזור
    back_button_div.style.display = "";

    //מוחק את הכותרת הכפתור וההגדרות
    title_div.style.display = "none";
    start_button_div.style.display = "none";
    settings_container.style.display = "none";

    let choose_bot_button = "";///הדיב של the code
    choose_bot_button +="<button class='random_button' onclick='bot_build_bord(false)'>play as code-master</button>"
    choose_bot_button +="<button class='random_button' onclick='bot_build_bord(true)'>play against bot</button>"
    the_code_div.innerHTML = choose_bot_button;
}

function create_bot_array() {
    if (allow_duplicates) {
        if (code_length >= 8 && num_color_bot >= 9) {
            show_error("too many colors")
            return
        }
        bot_create_array_duplicates();
    }
    else
        bot_create_array_uniqe();

    if (!allow_duplicates && code_length > number_colors) {
        show_error("Not enough colors to fill the code")
        return;
    }
}

function bot_build_bord(is_game_competition) {

    bot_moves_array = [];
    is_bot_mode = true;
    is_competition = is_game_competition;

    //מוחק את הכפתורים של הבחירה
    the_code_div.innerHTML = "";

    //מוחק את הלוח הקודם
    container_div.innerHTML = "";

    //מגלה את הדיב של הלוח
    container_div.style.display = "";

    try_counter = 0;

    //יוצר את בחירת הצבע
    create_color_selection(number_colors);
    input_div.style = "";

    ////יוצר מערך זמני להזנת המערך
    //temp_code = new Array(code_length);


    if (is_competition) {

        //יוצר מערך לקוד
        array_code = new Array(code_length);

        //יוצר מערך ללוח המשחק
        array_bord = new Array(num_tries);//מגדיר מערך לגודל המשחק

        for (let r = 0; r < array_bord.length; r++) {
            array_bord[r] = new Array(code_length)
            for (let c = 0; c < array_bord[r].length; c++) {
                array_bord[r][c] = null;
            }
        }

        //יוצר את הכפתורים ללוח המשחק
        for (let i = 0; i < num_tries; i++) {
            competition_create_row(i);
        }

        //בחירת קוד רנדומלי
        choose_random()

        set_color(0, document.getElementById("10000"));
    }
    else {

        //יוצר את הכפתורים ללוח המשחק
        for (let i = 0; i < num_tries; i++)
            bot_create_row(i);
        activate_row_bot(0);

        disable_color_selection(num_color_bot);

        bot_turn_blind();
    }
}

function bot_create_row(row_num) {

    let button_color = "<div id='row" + row_num + "' class='row_container'>";

    //יוצר את הזנת התשובות לבוט
    button_color += create_row_bot_answers(row_num);

    //יוצר את הכפתור להגשה
    button_color += create_row_submit(row_num,true);

    //יוצר את הכפתורים של הבוט
    button_color += create_row_guesses(row_num, true);

    //יוצר את הכפתורים לתשובות של הבוט
    button_color += create_row_answers(row_num, true);

    button_color += "</div>";//לסגור את הדיב שמכיל את השורה

    container_div.innerHTML += button_color;
}

function competition_create_row(row_num) {

    let button_color = "<div id='row" + row_num + "' class='row_container'>";

    //יוצר את הכפתורים לתשובות של השחקן
    button_color += create_row_answers(row_num, false);

    //יוצר את הכפתורים לשחקן
    button_color += create_row_guesses(row_num, false);

    //יוצר את הכפתור להגשה
    button_color += create_row_submit(row_num,false);


    //יוצר את הכפתורים של הבוט
    button_color += create_row_guesses(row_num, true);

    //יוצר את הכפתורים לתשובות של הבוט
    button_color += create_row_answers(row_num, true);


    button_color += "</div>";//לסגור את הדיב שמכיל את השורה

    container_div.innerHTML += button_color;
}

function submit_bot(button_submit) {

    if (currrent_guess_array == null) {
        show_error("you made a mistake!\nplease restart");
        return;
    }

    let submit_id = Number(button_submit.id);
    let try_num = submit_id - 500;

    bulls_bot = Number(document.getElementById(40000 + (try_num * 2)).value);
    bullseyes_bot = Number(document.getElementById(40000 + (try_num * 2) + 1).value);

    if (!is_valid_answer(bulls_bot, bullseyes_bot)) {
        show_error("invalid input");
        return;
    }

    let bot_first_id = 20000 + (code_length * try_counter);
    fill_answers(bot_first_id, bulls_bot, bullseyes_bot);

    if (bullseyes_bot == code_length) {
        end_screen("bot_win", "black");
        disable_row_bot(try_counter);
        return;
    }

    if (try_counter == num_tries - 1) {
        end_screen("bot_lose", "black");
        disable_row_bot(try_counter);
        return;
    }
    try_counter++;

    bot_turn_blind();

    if (currrent_guess_array != null) {
        disable_row_bot(try_counter - 1);
        activate_row_bot(try_counter);
    }
}

function is_valid_answer(bulls,bullseyes) {
    return bulls + bullseyes <= code_length;
}

function create_row_bot_answers(row_num) {

    let bot_answers = "";
    idnum = 40000 + row_num * 2;

    bot_answers += "<div id='bot_answers" + row_num + "' class='row_answers' style='opacity:0'>";

    bot_answers += "How many bulls?";
    bot_answers += "<input type='number' id='" + idnum.toString() + "' min='0' max='"+code_length+"' disabled>";
    idnum++;
    bot_answers += "How many bullseyes?";
    bot_answers += "<input type='number' id='" + idnum.toString() + "' min='0' max='" + code_length +"'disabled>";

    return bot_answers
}

function activate_row_bot(row_num) {
    let submit_id = 500 + row_num;
    let submit_button = document.getElementById(submit_id);
    submit_button.disabled = false;

    let number_input_id = 40000 + (row_num * 2);
    let number_input = document.getElementById(number_input_id);
    number_input.disabled = false;

    number_input_id++;
    number_input = document.getElementById(number_input_id);
    number_input.disabled = false;

    let numer_input_div = document.getElementById("bot_answers" + row_num);
    numer_input_div.style.opacity = "1";
}

function disable_row_bot(row_num) {
    let submit_id = 500 + row_num;
    let submit_button = document.getElementById(submit_id);
    submit_button.disabled = true;

    let number_input_id = 40000 + (row_num * 2);
    let number_input = document.getElementById(number_input_id);
    number_input.disabled = true;

    number_input_id++;
    number_input = document.getElementById(number_input_id);
    number_input.disabled = true;

    let numer_input_div = document.getElementById("bot_answers" + row_num);
    numer_input_div.style.opacity = "0";
}


function bot_turn() {
    if (try_counter == 0) {
        if (allow_duplicates)
            guess_duplicates();
        else
            guess_unique();
    }
    else
        currrent_guess_array = choose_new_guess(bot_array);
    bot_guess(bot_array);
}

function bot_turn_blind() {
    if (try_counter == 0) {
        if (allow_duplicates)
            guess_duplicates();
        else
            guess_unique();
    }
    else {
        update_bot_array(bot_array, currrent_guess_array, bulls_bot, bullseyes_bot);
        currrent_guess_array = choose_new_guess(bot_array);
    }
    if (currrent_guess_array != null)//אם המשתמש טעה בתשובות שהזין לבוט
        reveal_code(30000 + (try_counter * code_length), currrent_guess_array);
}

function reveal_moves() {

    idnum = 30000;
    let current_bot_button_id;

    for (let i = 0; i < bot_moves_array.length; i++)
        for (let j = 0; j < code_length; j++) {
            current_bot_button_id = idnum + (code_length * i) + j;
            current_bot_button = document.getElementById(current_bot_button_id)
            current_bot_button.className = "button_color_used";
            current_bot_button.style.backgroundColor = color[bot_moves_array[i][j]];
            current_bot_button.innerHTML = "";
        }
}

//////////////////////////////////////////

//function bot_full_guess_uniqe() {

//    bot_create_array_uniqe();
//    guess_unique();
//}
//function bot_full_guess_duplicates() {

//    bot_create_array_duplicates();
//    guess_duplicates();
//}
////////////////////////////////////////////
function bot_create_array_uniqe() {

    bot_array = [];
    let free_colors_array = new Array(num_color_bot).fill(1);
    let current_code_array = new Array(0);
    bot_possabilities_array_uniqe(bot_array, current_code_array, free_colors_array)
}

function bot_possabilities_array_uniqe(bot_array, current_array, free_colors_array) {
    if (current_array.length < code_length) {
        for (let i = 0; i < free_colors_array.length; i++)
            if (free_colors_array[i] == 1) {
                current_array.push(i);
                let new_free_colors_array = [...free_colors_array.slice(0, i), 0, ...free_colors_array.slice(i + 1)]
                bot_possabilities_array_uniqe(bot_array, current_array, new_free_colors_array)
                current_array.pop();
            }
    }
    else
        bot_array.push(current_array.slice());
}


//פונקציה שמנחשת את הניחוש הראשון כשאין צבעים שחוזרים על עצמם
function guess_unique() {
    let bot_guess_array = new Array(code_length);
    for (let i = 0; i < bot_guess_array.length; i++)
        bot_guess_array[i] = i;

    currrent_guess_array = bot_guess_array;
}
/////////////////////////////////////////////////////////



function bot_create_array_duplicates() {

    let num_possabilities = Math.pow(num_color_bot, code_length);
    bot_array = new Array(num_possabilities);
    bot_possabilities_array_duplicates(bot_array);
}

function bot_possabilities_array_duplicates(bot_array) {

    let corrent_code_array = new Array(code_length).fill(0);

    for (let i = 0; i < bot_array.length; i++) {
        bot_array[i] = corrent_code_array.slice();
        array_increase(corrent_code_array);
    }
}

function array_increase(array) {

    for (let i = 0; i <array.length; i++) {
        if (array[i] != num_color_bot - 1) {//ה-1 בגלל שהצבעים הם לפי אינדקס שמתחיל מ0 והמשתנה מייצג את אורך מערך אפשרויות הצבעים
            array[i]++;
            break;
        }
        else {
            array[i] = 0;
        }
    }
}

//פונקציה שמנחשת את הניחוש הראשון כשאין צבעים שחוזרים על עצמם
function guess_duplicates() {
    let bot_guess_array = new Array(code_length);
    let i = 0;
    for (; i < code_length / 2; i++)
        bot_guess_array[i] = 0;
    for (; i < code_length; i++)
        bot_guess_array[i] = 1;

    currrent_guess_array = bot_guess_array;
}
//////////////////////////////////////////////////////

let currrent_guess_array = new Array(code_length);
function bot_guess(bot_array) {

        bulls_bot = count_bull(array_code, currrent_guess_array)
        bullseyes_bot = count_bullseye(array_code, currrent_guess_array)

        let bot_first_id = 20000 + (code_length * try_counter);
        fill_answers(bot_first_id, bulls_bot, bullseyes_bot);

        hide_guesses(try_counter)

    bot_moves_array.push(currrent_guess_array.slice())
    //console.log('[' + currrent_guess_array + ']' + " ,bulls: " + bulls_bot + " ,bullseys: " + bullseyes_bot);///////

    update_bot_array(bot_array, currrent_guess_array, bulls_bot, bullseyes_bot)

}

let nulls = 0;

function update_bot_array(bot_array, array_guess, bulls_bot, bullseyes_bot) {

    for (let i = 0; i < bot_array.length; i++) {
        if (bot_array[i] != null) {
            if (count_bull(bot_array[i], array_guess) != bulls_bot ||
                count_bullseye(bot_array[i], array_guess) != bullseyes_bot) {
                bot_array[i] = null;
                nulls++;
            }
        }
    }
}


function choose_new_guess(bot_array) {

    let n = 0;
    while (bot_array[n] == null && n < bot_array.length-1)
        n++;
    return bot_array[n]
}

///////////////////////////////////////////
function get_correct_code_index(bot_array) {//for debaging
    for (let i = 0; i < bot_array.length; i++) {
        if (bot_array[i] != null) {
            console.log(bot_array[i])
            return i;
        }
    }
}

//////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
// נוסף: ===== כל הקוד של מצב Online מתחיל כאן =====
// נוסף: הקוד הסודי, חישוב הבול/פגיעה וקביעת המנצח נמצאים רק בשרת
//////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

function build_online() { // נוסף: נקראת בלחיצה על כפתור Online
    is_bot_mode = false; // נוסף: מבטיח שלא נשאר מצב בוט מהמשחק הקודם
    is_online_mode = true; // נוסף: מסמן שאנחנו במצב אונליין
    back_button_div.style.display = ""; // נוסף: מציג את כפתור החזרה לתפריט
    start_button_div.style.display = "none"; // נוסף: מסתיר את כפתורי בחירת המצב
    online_container_div.style.display = ""; // נוסף: מציג את מסך ההתחברות
    online_refresh_lobby(); // נוסף: מעדכן את הכפתור והשדות לפי מצב ההתחברות
    if (!online_logged_in) online_set_status("Log in (a new name creates a new account)"); // נוסף: הודעת הדרכה
    connect_online(); // נוסף: פותח חיבור לשרת
    if (online_logged_in) online_find_match(); // נוסף: אם כבר מחוברים - מחפשים יריב מיד
} // נוסף: סוף הפונקציה

function connect_online() { // נוסף: פותחת חיבור WebSocket לשרת אם עדיין אין
    if (ws) return; // נוסף: כבר יש חיבור פתוח או בתהליך פתיחה
    ws = new WebSocket(WS_URL); // נוסף: יוצר את החיבור לשרת
    ws.onmessage = (e) => online_handle(JSON.parse(e.data)); // נוסף: כל הודעה מהשרת עוברת לפונקציית הטיפול
    ws.onclose = () => { // נוסף: מה קורה כשהחיבור נסגר או נכשל
        ws = null; // נוסף: מאפס כדי שאפשר יהיה להתחבר מחדש
        online_logged_in = false; // נוסף: אחרי ניתוק צריך להתחבר מחדש
        online_set_status("Cannot reach the server at " + WS_URL + " - is it running?"); // נוסף: מודיע למשתמש לאיזו כתובת ניסינו להתחבר
        online_refresh_lobby(); // נוסף: מחזיר את שדות ההתחברות
    }; // נוסף: סוף ה-onclose
} // נוסף: סוף הפונקציה

function online_send(obj) { // נוסף: שולחת הודעת JSON לשרת (ממתינה אם החיבור עדיין נפתח)
    if (!ws) return; // נוסף: אין חיבור - אין למי לשלוח
    let socket = ws; // נוסף: שומר את החיבור הנוכחי במשתנה מקומי
    let text = JSON.stringify(obj); // נוסף: ממיר את האובייקט לטקסט JSON
    if (socket.readyState === WebSocket.OPEN) socket.send(text); // נוסף: אם החיבור פתוח - שולחים מיד
    else socket.addEventListener("open", () => socket.send(text), { once: true }); // נוסף: אחרת שולחים ברגע שהחיבור נפתח
} // נוסף: סוף הפונקציה

function online_go() { // נוסף: נקראת מכפתור login / find opponent
    connect_online(); // נוסף: מוודא שיש חיבור לשרת
    if (online_logged_in) online_find_match(); // נוסף: אם כבר מחוברים - מחפשים יריב
    else online_send({ type: "login", username: document.getElementById("online_username").value, password: document.getElementById("online_password").value }); // נוסף: אחרת שולח שם משתמש וסיסמה (שם חדש נרשם אוטומטית)
} // נוסף: סוף הפונקציה

function online_refresh_lobby() { // נוסף: מעדכנת את מסך ההתחברות לפי האם כבר מחוברים
    document.getElementById("online_login").style.display = online_logged_in ? "none" : ""; // נוסף: שדות שם וסיסמה מוצגים רק לפני ההתחברות
    online_go_button.textContent = online_logged_in ? "find opponent" : "login"; // נוסף: הכיתוב של הכפתור
} // נוסף: סוף הפונקציה

function online_read_settings() { // נוסף: קוראת את ההגדרות מהסליידרים ובודקת שהן חוקיות (מחזירה null אם לא)
    let settings = { // נוסף: אובייקט עם כל הגדרות המשחק
        code_length: Number(length_slide.value), // נוסף: אורך הקוד
        num_tries: Number(tries_slide.value), // נוסף: מספר ניסיונות
        number_colors: Number(number_colors_slide.value), // נוסף: מספר צבעים
        allow_duplicates: duplicates_checkbox.checked // נוסף: האם מותר לחזור על צבע
    }; // נוסף: סוף האובייקט
    if (!settings.allow_duplicates && settings.code_length > settings.number_colors) { // נוסף: אותה בדיקה כמו ב-build_bord
        show_error("Not enough colors to fill the code"); // נוסף: מציג שגיאה (פונקציה קיימת)
        return null; // נוסף: מסמן שההגדרות לא חוקיות
    } // נוסף: סוף ה-if
    return settings; // נוסף: מחזיר את ההגדרות
} // נוסף: סוף הפונקציה

function online_find_match() { // נוסף: מבקשת מהשרת למצוא יריב
    online_my_settings = online_read_settings(); // נוסף: קורא את ההגדרות מהסליידרים
    if (!online_my_settings) return; // נוסף: הגדרות לא חוקיות - לא מחפשים
    online_set_status("Searching for an opponent..."); // נוסף: הודעה למשתמש
    online_send({ type: "find_match", settings: online_my_settings }); // נוסף: בקשת חיפוש יריב + ההגדרות שלי (השרת ישתמש בהגדרות של מי שמתחיל)
} // נוסף: סוף הפונקציה

function online_set_status(text) { // נוסף: מציגה הודעה למשתמש
    online_status_div.textContent = text; // נוסף: במסך ההתחברות
    online_turn_div.textContent = text; // נוסף: ובחיווי הקבוע בזמן משחק
} // נוסף: סוף הפונקציה

function online_update_turn() { // נוסף: מציגה של מי התור
    online_set_status("vs " + online_opponent_name + " - " + (online_my_turn ? "YOUR TURN" : "opponent's turn")); // נוסף: שם היריב ומי בתור
} // נוסף: סוף הפונקציה

function online_handle(d) { // נוסף: מטפלת בכל הודעה שמגיעה מהשרת
    if (d.type == "auth_ok") online_logged_in = true; // נוסף: ההתחברות הצליחה - זוכרים את זה
    if (!is_online_mode) return; // נוסף: אם יצאנו ממצב אונליין - מתעלמים משאר ההודעות
    if (d.type == "auth_ok") { online_refresh_lobby(); online_find_match(); } // נוסף: אחרי התחברות מחליפים את הכפתור ומחפשים יריב
    else if (d.type == "waiting") online_set_status("Waiting for an opponent..."); // נוסף: אין עדיין יריב
    else if (d.type == "match_start") online_match_start(d); // נוסף: נמצא יריב
    else if (d.type == "move_ok") online_my_result(d); // נוסף: השרת החזיר תשובה על הניחוש שלי
    else if (d.type == "opponent_move") online_opponent_move(d); // נוסף: היריב ניחש והשרת שלח את הניחוש והתשובה
    else if (d.type == "game_over") online_game_end(d); // נוסף: המשחק נגמר - השרת שלח תוצאה וחושף את הקוד
    else if (d.type == "error") online_set_status("Error: " + d.message); // נוסף: שגיאה מהשרת (סיסמה שגויה, לא התור שלך וכו')
} // נוסף: סוף הפונקציה

function online_match_start(d) { // נוסף: נקראת כשנמצא יריב (d.opponent, d.your_turn, d.settings)
    online_my_turn = d.your_turn; // נוסף: השרת קובע מי מתחיל
    online_opponent_name = d.opponent; // נוסף: שם היריב
    online_build_bord(d.settings); // נוסף: בונה לוח לפי ההגדרות שהשרת שלח
    create_code_template(); // נוסף: מציג את שורת הקוד עם סימני שאלה (פונקציה קיימת) - הקוד עצמו לא ידוע לנו
    if (d.your_turn) activate_row(0); // נוסף: אם אני מתחיל - מפעיל את השורה הראשונה
    online_update_turn(); // נוסף: מציג של מי התור
} // נוסף: סוף הפונקציה

function online_build_bord(settings) { // נוסף: בונה את לוח המשחק לפי הגדרות (בדומה ל-bot_build_bord)

    code_length = settings.code_length; // נוסף: מעדכן את אורך הקוד
    num_tries = settings.num_tries; // נוסף: מעדכן את מספר הניסיונות
    number_colors = settings.number_colors; // נוסף: מעדכן את מספר הצבעים
    allow_duplicates = settings.allow_duplicates; // נוסף: מעדכן האם מותר לחזור על צבע
    try_counter = 0; // נוסף: מתחילים מהניסיון הראשון
    is_competition = true;

    bot_moves_array = []; // נוסף: כאן נשמרים הניחושים של היריב (אותו משתנה שבו הבוט משתמש)
    array_code = new Array(code_length); // נוסף: מערך הקוד - נשאר ריק עד סוף המשחק (השרת חושף אותו רק בסוף)
    temp_code = new Array(code_length); // נוסף: מערך עזר לקוד ידני (כמו במצבים האחרים)

    array_bord = Array.from({ length: num_tries }, () => new Array(code_length).fill(null)); // נוסף: לוח ניחושים ריק

    container_div.innerHTML = ""; // נוסף: מנקה את הלוח הקודם

    for (let i = 0; i < num_tries; i++)
        competition_create_row(i); // נוסף: בונה שורות עם עמודת היריב (פונקציה קיימת של מצב הבוט)

    container_div.style.display = ""; // נוסף: מציג את הלוח
    title_div.style.display = "none"; // נוסף: מסתיר את הכותרת
    online_container_div.style.display = "none"; // נוסף: מסתיר את מסך ההתחברות
    settings_container.style.display = "none"; // נוסף: מסתיר את ההגדרות
    online_turn_div.style.display = ""; // נוסף: מציג את חיווי התור

    create_color_selection(number_colors); // נוסף: בונה את פלטת הצבעים
    input_div.style = ""; // נוסף: מציג את אזור הפלטה
    pre_button = "10000"; // נוסף: מאפס את הכפתור שנבחר קודם (אולי כבר לא קיים בפלטה החדשה)
    set_color(0, document.getElementById("10000")); // נוסף: בוחר את הצבע הראשון
} // נוסף: סוף הפונקציה

function online_my_move(try_num) { // נוסף: נקראת מ-submit אחרי שלחצתי על שליחת ניחוש
    disable_row(try_num); // נוסף: נועל את השורה שלי (פונקציה קיימת)
    online_send({ type: "move", move: array_bord[try_num] }); // נוסף: שולח לשרת את מערך הניחוש שלי
    try_counter++; // נוסף: עוברים לשורה הבאה שלי (כמו ב-submit המקורי)
    online_my_turn = false; // נוסף: עכשיו התור של היריב
    online_update_turn(); // נוסף: מעדכן את חיווי התור
} // נוסף: סוף הפונקציה

function online_my_result(d) { // נוסף: השרת החזיר את התשובה (d.bulls, d.bullseyes) לניחוש האחרון שלי
    fill_answers(1000 + code_length * (try_counter - 1), d.bulls, d.bullseyes); // נוסף: מציג את התשובה בשורה שזה עתה שלחתי (פונקציה קיימת)
} // נוסף: סוף הפונקציה

function online_opponent_move(d) { // נוסף: נקראת כשמגיע הניחוש של היריב (d.move, d.bulls, d.bullseyes, d.your_turn)
    let row = bot_moves_array.length; // נוסף: מספר השורה של היריב
    bot_moves_array.push(d.move.slice()); // נוסף: שומר את הניחוש כדי לחשוף אותו בסוף המשחק
    fill_answers(20000 + code_length * row, d.bulls, d.bullseyes); // נוסף: מציג את התשובות של הניחוש של היריב (שהשרת חישב)
    hide_guesses(row); // נוסף: מציג את הניחוש שלו כסימני שאלה (פונקציה קיימת)
    online_my_turn = d.your_turn; // נוסף: השרת קובע אם עכשיו התור שלי (false אם המשחק נגמר)
    online_update_turn(); // נוסף: מעדכן את חיווי התור
    if (d.your_turn) activate_row(try_counter); // נוסף: אם המשחק נמשך - מפעיל את השורה הבאה שלי
} // נוסף: סוף הפונקציה

function online_game_end(d) { // נוסף: המשחק נגמר (d.result, d.color, d.code, אולי d.reason)
    array_code = d.code.slice(); // נוסף: עכשיו השרת חושף את הקוד, כדי ש-end_screen יציג אותו
    end_screen(d.result, d.color); // נוסף: מציג את מסך הסיום (פונקציה קיימת) - win / lose / drew
    reveal_moves(); // נוסף: חושף את הניחושים של היריב (פונקציה קיימת)
    online_set_status(d.reason == "opponent_left" ? "Opponent left the game" : "Game over"); // נוסף: הודעה למשתמש
} // נוסף: סוף הפונקציה

function online_play_again() { // נוסף: נקראת מכפתור play again אחרי משחק אונליין
    online_send({ type: "leave" }); // נוסף: עוזב בשרת את המשחק שנגמר
    container_div.innerHTML = ""; // נוסף: מנקה את הלוח
    the_code_div.innerHTML = ""; // נוסף: מנקה את שורת הקוד
    input_div.innerHTML = ""; // נוסף: מנקה את הפלטה ואת כפתור play again
    online_turn_div.style.display = "none"; // נוסף: מסתיר את חיווי התור
    title_div.style.display = ""; // נוסף: מציג שוב את הכותרת
    settings_container.style.display = ""; // נוסף: מציג את ההגדרות (אפשר לשנות לפני המשחק הבא)
    online_container_div.style.display = ""; // נוסף: מציג את מסך ההמתנה
    online_find_match(); // נוסף: מחפש יריב חדש
} // נוסף: סוף הפונקציה

function online_exit() { // נוסף: נקראת מ-build_home - יוצאת ממצב אונליין
    if (!is_online_mode) return; // נוסף: אם לא היינו באונליין אין מה לעשות
    if (online_logged_in) online_send({ type: "leave" }); // נוסף: מבטל חיפוש / עוזב משחק בשרת
    is_online_mode = false; // נוסף: יוצאים ממצב אונליין
    online_container_div.style.display = "none"; // נוסף: מסתיר את מסך ההתחברות
    online_turn_div.style.display = "none"; // נוסף: מסתיר את חיווי התור
} // נוסף: סוף הפונקציה
