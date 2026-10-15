
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

function update_slider_display(range,display_num) {
    display_num.innerHTML = range.value;
}
function build_home() {

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
    button_color += create_row_submit(row_num);

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
        guess_buttons += "<button id='" + idnum.toString() + "'onclick='change_array(this)'; class='button_color_disabled' disabled>";
        guess_buttons += " ";
        guess_buttons += "</button>";
        idnum++;
    }
    if (is_bot_row)
        guess_buttons += "</div>";

    return guess_buttons
}

function create_row_submit(row_num) {

    let submit_button = "";

     idnum = 500 + row_num;

    submit_button += "<button id='" + idnum.toString() + "' onclick='submit(this)' class='button_submit_disabled' disabled>";
    submit_button += "submit";
    submit_button += "</button>";
    submit_button += "</div>";//לסגור את הדיב של הכפתור של ההגשה וכפתורי הניחוש


    return submit_button;
}

function create_color_selection(number_of_colors) {

    let color_pick = "<button id='10000' onclick='set_color(0,this)' class='selected_color' style='background-color: red;' >";
    for (let i = 1; i < number_of_colors; i++) {
        color_pick += "<button id='"+(10000+i)+"' onclick='set_color("+i+",this)' class='select_color' style='background-color: "+color[i]+";' >";
    }
    input_div.innerHTML = color_pick;
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
function fill_answers(first_id,bulls,bullseyes) {

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

    reveal_code();

    if (is_bot_mode)
        input_div.innerHTML = "you " + result + "! <button class='button_play_again' onclick='bot_build_bord()'>play again?</button > ";
    else
        input_div.innerHTML = "you " + result + "! <button class='button_play_again' onclick='build_bord()'>play again?</button > ";

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

    //מפעיל את השורה הראשונה
    activate_row(0)

    console.log(array_code)
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

    //מפעיל את השורה הראשונה
    activate_row(0)


    console.log(array_code)
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
    let try_counter = button_code.id - 200;
    try_counter = Number(try_counter);
    temp_code[try_counter] = co
    ///
}

function manual_color_pick_submit() {

    if (is_array_full(temp_code)&&(allow_duplicates||is_unique_array(temp_code))) {

        for (let i = 0; i < code_length; i++) {
            array_code[i] = temp_code[i]
        }

        //יוצר תצוגה של אורך הקוד
        create_code_template();

        //מפעיל את השורה הראשונה
        activate_row(0)

        set_color(0, document.getElementById("10000"));

        console.log(array_code)
    }
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
function reveal_code() {
    for (let i = 0; i < array_code.length; i++) {
        let code_id = i + 200;
        code_button = document.getElementById(code_id);
        code_button.innerHTML = "";
        code_button.style.backgroundColor = color[array_code[i]]
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
function bot_build_bord() {

    bot_moves_array = [];
    is_bot_mode = true;

    code_length = Number(length_slide.value);
    num_tries = Number(tries_slide.value);
    number_colors = Number(number_colors_slide.value);
    allow_duplicates = duplicates_checkbox.checked;

    num_color_bot = number_colors;

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
        bot_create_row(i);
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

function bot_create_row(row_num) {

    let button_color = "<div id='row" + row_num + "' class='row_container'>";

    //יוצר את הכפתורים לתשובות של השחקן
    button_color += create_row_answers(row_num, false);

    //יוצר את הכפתורים לשחקן
    button_color += create_row_guesses(row_num, false);

    //יוצר את הכפתור להגשה
    button_color += create_row_submit(row_num);


    //יוצר את הכפתורים של הבוט
    button_color += create_row_guesses(row_num, true);

    //יוצר את הכפתורים לתשובות של הבוט
    button_color += create_row_answers(row_num, true);


    button_color += "</div>";//לסגור את הדיב שמכיל את השורה

    container_div.innerHTML += button_color;
}

function bot_turn() {
    if (try_counter == 0) {
        if (allow_duplicates)
            guess_duplicates();
        else
            guess_unique();
    }
    else {
        currrent_guess_array = choose_new_guess(bot_array);
        bot_guess(bot_array);
    }
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

function bot_full_guess_uniqe() {

    bot_create_array_uniqe();
    guess_unique();
}
function bot_full_guess_duplicates() {

    bot_create_array_duplicates();
    guess_duplicates();
}
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


function guess_unique() {
    let bot_guess_array = new Array(code_length);
    for (let i = 0; i < bot_guess_array.length; i++)
        bot_guess_array[i] = i;

    currrent_guess_array = bot_guess_array;
    bot_guess(bot_array)
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


function guess_duplicates() {
    let bot_guess_array = new Array(code_length);
    let i = 0;
    for (; i < code_length / 2; i++)
        bot_guess_array[i] = 0;
    for (; i < code_length; i++)
        bot_guess_array[i] = 1;

    currrent_guess_array = bot_guess_array;
    bot_guess(bot_array)
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

    //if (count_bullseye(array_code, currrent_guess_array) == code_length) {//כל מספר הבול-פגיעה לא שווה לאורך הקוד
    //    //console.log(currrent_guess_array);///////
    //    //console.log("The bot took *" + number_bot_tries + "* attempts");//////
    //    reveal_moves()
    //    reveal_code()
    //}

}

function update_bot_array(bot_array, array_guess, bulls_bot, bullseyes_bot) {

    for (let i = 0; i < bot_array.length; i++) {
        if (bot_array[i] != null) {
            if (count_bull(bot_array[i], array_guess) != bulls_bot ||
                count_bullseye(bot_array[i], array_guess) != bullseyes_bot) {
                bot_array[i] = null;
            }
        }
    }
}


function choose_new_guess(bot_array) {

    let n = 0;
    while (bot_array[n] == null) {
        n++;
    }
    return bot_array[n]
}


function get_correct_code_index(bot_array) {//for debaging
    for (let i = 0; i < bot_array.length; i++) {
        if (bot_array[i] != null) {
            console.log(bot_array[i])
            return i;
        }
    }
}
