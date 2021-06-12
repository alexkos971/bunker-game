const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

// const url = "https://randomall.ru/api/custom/gens/747";
const url = "https://randomall.ru/api/custom/gens/1717";

// let dataObj = {
//     'Профессия': [],
//     'Пол': [],
//     'Способность к деторождению': [],
//     'Возраст': [],
//     'Состояние здоровья': [],
//     'Черта характера': [],
//     'Фобия': [],
//     'Хобби': [],
//     'Доп информация': [],
//     'Багаж': [],
//     'Карта1': [],
//     'Карта2': []
// }

let dataObj = {
    'Катастрофа': [],
    'Остаток выжившего населения': [],
    'Площадь убежища (м^2)': [],
    'Время нахождения в убежище': [],
    'В убежище есть': [],
    'В убежище есть': [],
    'В убежище есть': [],
    'в бункере находятся': []
}

const getData = async () => {
    const res = await axios.post(url);
    const arr = await res.data.msg.split('\n').map(el => {
        const arr_el = el.replace(':-', '---').split('---').map(le => le.trim())
        // console.log(arr_el);

        if (Array.isArray(dataObj[arr_el[0]]) && dataObj[arr_el[0]].indexOf() <= -1) {
            dataObj[arr_el[0].trim()].push(arr_el[1].trim().toUpperCase())
        }


        // const arr_el = el.replace('-', '----').split('----').map(le => le.trim());
        // if (Array.isArray(dataObj[arr_el[0]]) && dataObj[arr_el[0]].indexOf() <= -1) {
        //     dataObj[arr_el[0].trim()].push(arr_el[1].trim().toUpperCase())
        // }
    })
    let newArr = arr.slice(0, -1);
    return newArr;

}

const disast  = "Вахтёр; Серийный убийца; Профессиональный нюхатель подмышек; Танкист; Мангака; Профессиональный стоящий в очереди; Трамбовщик пассажиров; Запаховед; Профессиональный обниматель; Дегустатор корма для животных; Писатель предсказаний для печенья; Репер; Скамер; Плакальщи; ♂Dungeon master♂; Волейболист; DJ; Психолог для животных; Смотритель за пенсионерами; Взламователь жопы; Аниматор; Друг на час; Морпех; Гук; Казак; Диджитал Таджик; Кладмен; Работник морга"
let newDisast = disast.split('; ').map(item => {
    return item.toUpperCase();
})
console.log(JSON.stringify(newDisast))





// (async () => {
//     await getData();
//     console.log(dataObj)
// })()

// (async () => {
//     try {
//         let count = 0;

//         const cycle = async () => {
//             if (count >= 5000) {
//                 return;
//             }

//             setTimeout(async () => {
//                 await getData();
                
//                 await Object.keys(dataObj).forEach(item => {
//                     let uniqueArray = dataObj[item].filter(function (elem, pos) {
//                         return dataObj[item].indexOf(elem) == pos;
//                     })
//                     dataObj[item] = uniqueArray
//                 });
//                 let file = JSON.stringify(dataObj);
//                 fs.writeFileSync('disasters.json', file, (err) => {
//                     if (err) console.log(err)
//                 })
//                 console.log('push');
//                 count += 1;
//                 await cycle();
//             }, 100)
//         }
//         await cycle();

//         // await getData();
//         // console.log(dataObj);
//     } catch (e) {
//         console.error(e)
//     }
// })
// ()