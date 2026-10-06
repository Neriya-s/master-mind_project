
//parseInt(prompt("dfgh"))//äâãøú îùúðä ùòøëå äåà òøê îñôøé c#
//"\n"//ìøãú ùåøä áäúøàä
//.push(5)//ìäåñéó àéáø ìîòøê

const title_div = document.getElementById("title");
const input_div = document.getElementById("input");
const start_button_div = document.getElementById("start_button");
const container_div = document.getElementById("container");
const the_code_div = document.getElementById("the_code")
const back_button_div = document.getElementById("back_button");

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
    container_div.innerHTML = "";//îåç÷ àú äìåç ä÷åãí
    container_div.style.display = "none";

}


function build_bord() {

    code_length = Number(length_slide.value);
    num_tries = Number(tries_slide.value);
    number_colors = Number(number_colors_slide.value);
    allow_duplicates = duplicates_checkbox.checked;

    if (!allow_duplicates && code_length > number_colors) {
        show_error("Not enough colors to fill the code")
        return;
    }

    try_counter = 0;

    temp_code = new Array(code_length);

    //îâìä àú ëôúåø äçæåø
    back_button_div.style.display = "";

    //éåöø îòøê ììåç äîùç÷

    array_bord = new Array(num_tries);//îâãéø îòøê ìâåãì äîùç÷

    for (let r = 0; r < array_bord.length; r++) {
        array_bord[r] = new Array(code_length)
        for (let c = 0; c < array_bord[r].length; c++) {
            array_bord[r][c] = null;
        }
    }

    container_div.innerHTML = "";//îåç÷ àú äìåç ä÷åãí
    //éåöø àú äëôúåøéí ììåç äîùç÷
    for (let i = 0; i < num_tries; i++) {
        create_row(i);
    }
    container_div.style.display = "";

    //éåöø îòøê ì÷åã
    array_code = new Array(code_length);

    // áçéøä àí ä÷åã éäéä øðãåîìé àå éãðé òì éãé ëôúåøéí
    let choose = "<button onclick='choose_random()' class='random_button'>";
    choose = choose + "random";
    choose = choose + "</button>";
    choose = choose + "<button onclick='manual_code()' class='manual_button'>";
    choose = choose + "manual";
    choose = choose + "</button>";
    the_code_div.innerHTML = choose;


    //îåç÷ àú äëåúøú äëôúåø åääâãøåú
    title_div.style.display = "none";
    start_button_div.style.display = "none";
    settings_container.style.display = "none";

    //éåöø àú áçéøú äöáò
    create_color_selection(number_colors);
    input_div.style = "";

    set_color(0, document.getElementById("10000"));
}

//î÷áì îñôø åéåöø àú äùåøä ùì äîñôø
function create_row(row_num) {

    let button_color = "<div id='row" + row_num + "' class='row_container'>";
    //éåöø àú äëôúåøéí ìúùåáåú
    idnum = 1000 + (row_num * code_length);

    button_color += "<div id='row_answers" + row_num + "' class='row_answers'>";
    if (row_num < 9)//îåñéó úååéí áìúé ðøàä ëãàé ùäùåøåú éäéå îñåãøåú
        button_color += "<span>\u00A0\u00A0</span>";
    button_color += (row_num+1);
    button_color += ".";

    for (let c = 0; c < code_length; c++) {
        button_color += "<button id='" + idnum.toString() + "'; class='button_answer'>";
        button_color += "</button>";
        idnum++;
    }
    button_color += "</div>";

    //éåöø àú äëôúåøéí ììåç äîùç÷
    idnum = 0 + (row_num * code_length);

    button_color += "<div id='row_guesses" + row_num + "' class='row_guesses'>";
    if (row_num < 9)//îåñéó úååéí áìúé ðøàä ëãàé ùäùåøåú éäéå îñåãøåú
        button_color += "<span>\u00A0\u00A0</span>";
    button_color += (row_num + 1);
    button_color += ".";


    for (let c = 0; c < code_length; c++) {
        button_color += "<button id='" + idnum.toString() + "'onclick='change_array(this)'; class='button_color_disabled' disabled>";
        button_color += " ";
        button_color += "</button>";
        idnum++;
    }

    //éåöø àú äëôúåø ìäâùä
    let id_submit = 500 + row_num;

    button_color += "<button id='" + id_submit.toString() + "' onclick='submit(this)' class='button_submit_disabled' disabled>";
    button_color += "submit";
    button_color += "</button>";
    button_color += "</div>";

    button_color += "</div>";

    container_div.innerHTML += button_color;

}


function create_color_selection(number_of_colors) {

    let color_pick = "<button id='10000' onclick='set_color(0,this)' class='selected_color' style='background-color: red;' >";
    for (let i = 1; i < number_of_colors; i++) {
        color_pick += "<button id='"+(10000+i)+"' onclick='set_color("+i+",this)' class='select_color' style='background-color: "+color[i]+";' >";
    }
    input_div.innerHTML = color_pick;
}

//îùðä àú öáò äëôúåø ìôé äîñôø ùäîùúîù áåçø
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

//îùðä àú îòøê ìåç äîùç÷ áëì ôòí ùìåçöéí òì ëôúåø ðéçåù(ùçåø)
function change_array(button) {
    let co = color_selected_num;
    document.getElementById(button.id).style.backgroundColor = color[co];
    document.getElementById(button.id).style.border = "2px solid black";

    // let r = Math.floor(button.id / code_length);//àéæä ùåøä/àéôä áèåø
    let c = button.id % code_length;//àéæä èåø/àéôä áùåøä

    array_bord[try_counter][c] = co;
}

//î÷áì îòøê ðëåï åîòøê ùì ðéçåù åîçæéø ëîä "áåì" éù
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

//î÷áì îòøê ðëåï åîòøê ùì ðéçåù åîçæéø ëîä "áåì ôâéòä" éù
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

    if (is_array_full(array_bord[try_num])) {//áåã÷ àí äîùúîù îéìà àú ëì ä÷åã

        let bull = count_bull(array_code, array_bord[try_num])
        let bullseye = count_bullseye(array_code, array_bord[try_num])

        disable_row(try_num);//îáèì àú äùåøä äðåëçéú

        if (bullseye == code_length)//áåã÷ àí éù ðéöçåï
            win();
        else if (try_num < num_tries - 1)//áåã÷ àí æä ìà ëôúåø ääâùä äàçøåï
            activate_row(try_num + 1);//îôòéì àú äùåøä äáàä
        else
            lose();




        //îùðä àú äöáò ùì äëôúåøéí ùì äúùåáåú ìôé "áåì" å"áåì ôâéòä"
        for (let i = 0; i < code_length; i++) {
            let button_answer_id = 1000 + i + code_length * try_num;
            let button_answer = document.getElementById(button_answer_id);
            if (bullseye > 0) {
                button_answer.style.backgroundColor = "red";
                bullseye--;
            }
            else {
                if (bull > 0) {
                    button_answer.style.backgroundColor = "yellow";
                    bull--;
                }
            }
        }

        try_counter++;
    }
}

function lose() {

    reveal_code()

    input_div.innerHTML = "you lose!" + "<button class='button_play_again' onclick='build_bord()'>play again?</button > ";
    document.getElementById("lose_overlay").style.display = "block";
}

function win() {

    reveal_code()

    input_div.innerHTML = "you win!" + "<button class='button_play_again' onclick='build_bord()'>play again?</button > ";
    document.getElementById("win_overlay").style.display = "block";
}
function hide() {
    document.getElementById("win_overlay").style.display = "none";
    document.getElementById("lose_overlay").style.display = "none";
}

function choose_random() {//
    if (allow_duplicates)
        random_code_duplicates();
    else
        random_code_unique();
}

function random_code_unique() {
    //éåöø îòøê ùì äàéðã÷ñéí ùì äöáòéí
    let num_for_colors = new Array(number_colors);
    for (let i = 0; i < num_for_colors.length; i++) {
        num_for_colors[i] = i;
    }
    //îòøáá àú äîòøê
    scramble_array(num_for_colors);

    //îùååä àú ä÷åã ìñôøåú äøàùåðåú ùì äîòøê äîòåøáá
    for (let i = 0; i < code_length; i++) {
        array_code[i] = num_for_colors[i];
    }

    //éåöø ééöåâ ùì ä÷åã
    create_code_template()

    //îôòéì àú äùåøä äøàùåðä
    activate_row(0)

}

function random_code_duplicates() {
    //îâãéø ÷åã øðãåîìé áîòøê

    let color_code_num;
    for (let i = 0; i < code_length; i++) {
        color_code_num = random_int(0,number_colors-1);
        array_code[i] = color_code_num;
    }

    //éåöø ééöåâ ùì ä÷åã
    create_code_template()

    //îôòéì àú äùåøä äøàùåðä
    activate_row(0)

}

function manual_code() {

    //éåöø ëôúåø ùäîùúîù îæéï áå àú ä÷åã
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

    if (is_array_full(temp_code)) {

        for (let i = 0; i < code_length; i++) {
            array_code[i] = temp_code[i]
        }

        //éåöø úöåâä ùì àåøê ä÷åã
        create_code_template();

        //îôòéì àú äùåøä äøàùåðä
        activate_row(0)

        set_color(0, document.getElementById("10000"));
    }
}


//////////////////////////////////////////
//////////////////////////////////////////

//îòøáá îòøê
function scramble_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

//îçæéø îñôø ùìí áéï îéðéîåí ìî÷ñéîåí ëåìì ä÷öååú
function random_int(min,max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//áåã÷ àí îòøê îìà
function is_array_full(array_to_check) {
    for (let i = 0; i < array_to_check.length; i++) {
        if (array_to_check[i] == null)
            return false;
    }
    return true;
}

//îôòéì ùåøä ùì ðéçåù
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

//îáèì ùåøä ùì ðéçåù
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

//éåöø úöåâä ùì àåøê ä÷åã
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

//îöéâ àú ä÷åã äðëåï
function reveal_code() {
    for (let i = 0; i < array_code.length; i++) {
        let code_id = i + 200;
        code_button = document.getElementById(code_id);
        code_button.innerHTML = "";
        code_button.style.backgroundColor = color[array_code[i]]
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
let num_color_bot = number_colors;//(n <= 9) for dup// áëîä öáòéí ùåðéí äáåè éëåì ìäùúîù
    // code_length <= 7 for dup// îä àåøê ä÷åã

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

    bot_guess(bot_array, bot_guess_array)
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
        if (array[i] != num_color_bot - 1) {//ä-1 áâìì ùäöáòéí äí ìôé àéðã÷ñ ùîúçéì î0 åäîùúðä îééöâ àú àåøê îòøê àôùøåéåú äöáòéí
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

    bot_guess(bot_array, bot_guess_array)
}
//////////////////////////////////////////////////////

function bot_guess(bot_array, bot_guess_array) {

    let i = 0;
    while (count_bullseye(array_code, bot_guess_array)!=code_length) {//ëì îñôø äáåì-ôâéòä ìà ùååä ìàåøê ä÷åã

        bulls_bot = count_bull(array_code, bot_guess_array)
        bullseyes_bot = count_bullseye(array_code, bot_guess_array)

        console.log('['+bot_guess_array+']' + " ,bulls: " + bulls_bot + " ,bullseys: " + bullseyes_bot);///////

        update_bot_array(bot_array, bot_guess_array, bulls_bot, bullseyes_bot)

        bot_guess_array = choose_new_guess(bot_array);
        i++;
    }
    i++;
    console.log(bot_guess_array);///////
    console.log("The bot took *" + i + "* attempts");//////
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
