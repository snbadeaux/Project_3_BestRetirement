const urlJSONByColumn = '/static/DatasetManipulations/truncated_nursing_df2.json';
const urlJSONByRow = '/static/DatasetManipulations/truncated_nursing_df2_by_record.json';
const urlJSONCorrelationsByRow = '/static/DatasetManipulations/correlations_df_by_record.json';
const colors = ['#a0d', '#b6a', '#e87', '#ed3', '#c0ee11', '#6f0'];
const listOfTruncatedNursingDataFrameColumns = ['Federal Provider Number', 'Provider Name',
    'Provider City', 'Provider State', 'Provider Zip Code', 'Provider County Name',
    'Ownership Type', 'Number of Certified Beds', 'Number of Residents in Certified Beds',
    'Provider Type', 'Provider Resides in Hospital',
    'Most Recent Health Inspection More Than 2 Years Ago',
    'Automatic Sprinkler Systems in All Required Areas', 'Overall Rating',
    'Health Inspection Rating', 'Staffing Rating', 'RN Staffing Rating',
    'Total Weighted Health Survey Score', 'Number of Facility Reported Incidents',
    'Number of Substantiated Complaints', 'Number of Fines',
    'Total Amount of Fines in Dollars', 'Number of Payment Denials',
    'Total Number of Penalties', 'Location', 'Processing Date', 'Latitude',
    'Adjusted Total Nurse Staffing Hours per Resident per Day', 'Longitude'];

let dropDownMenuValue;
let categoryCount = 0;
let categoryPanelList = [];
let myMap;
let listOfWeightedCategories;
let doughnutChartWeightedTotals;
let correleationsCategoryChart;
let groupCategoryWeightsChart;


// Global letiable to hold a deep copy of retrieved data
let dataByColumn = null;
let dataByRow = null;
let correlationsByRow = null;

let alreadyPopulated = false;

let topXRecords = [];
let topXRecordColumns = [];



function disableRadioButton(disableIt, buttonId) {
    let radioButton = document.getElementById(buttonId);
    radioButton.disabled = disableIt;
    if (buttonId.includes('range') && disableIt) {
        let allOrNothingRadioButton = document.getElementById(`all${buttonId.substring('range'.length)}`);
        allOrNothingRadioButton.checked = true;
    } else if (buttonId.includes('range') && !disableIt) {
        radioButton.checked = true;

    }
}

function isDollarAmount(value) {
    const regex = /^\$\d+(\.\d{2})?$/;
    return regex.test(value);
}

function populateValuesOfCategory(selectId) {
    let numStr = selectId.substring('selDataset'.length);
    let valueIdNum = parseInt(numStr) + 1;
    let valueId = 'selDataset' + valueIdNum;
    let dropDownMenuValue = d3.select(`#${valueId}`);

    let category_key = document.getElementById(selectId).value;



    // console.log(`category_key: ${category_key}`);
    // console.log(`category_key.value: ${category_key.value}`);
    // console.log(category_key.value);
    // let keys = Object.keys(data1);
    // console.log('hi');


    let selectElement = dropDownMenuValue.node(); // Get the actual DOM element

    if (selectElement && selectElement.options && selectElement.options.length > 0) {
        selectElement.options.length = 0;
    }

    // data can't be null
    if (dataByColumn != null) {

        let categoryDictionary = structuredClone(dataByColumn[category_key]);

        // Remove the duplicate values in the category
        let seenValues = new Set();
        let result = {};
        let allValuesAreNumbers = true;
        for (let key in categoryDictionary) {
            let value = categoryDictionary[key];
            if (!isDollarAmount(value) && typeof value != 'number' && value !== null) {
                // console.log(3);
                allValuesAreNumbers = false;
            }
            if (!seenValues.has(value)) {
                seenValues.add(value);
                result[key] = value;
            }
        }


        // instead make a list of columns that makes sense to use as a range
        // in weighting and test if the current category is in the list
        if (allValuesAreNumbers) {
            disableRadioButton(false, `range${parseInt(numStr) / 2}`);
        } else {
            disableRadioButton(true, `range${parseInt(numStr) / 2}`);
        }


        // console.log(dropDownMenuValue);

        let sortedByValues = structuredClone(result);
        let entries = Object.entries(sortedByValues);
        let sortedArray = entries.sort(([, a], [, b]) => a - b);
        let sortedMap = new Map(sortedArray);
        // console.log('222999999999999999999');
        let sorted2DArray = [...sortedMap];

        for (let i = 0; i < sorted2DArray.length; i++) {
            let option1 = dropDownMenuValue.append('option').text(sorted2DArray[i][1]);
            option1.attr('value', sorted2DArray[i][1]);
        }
        // alreadyPopulated = true;
    }

}


function validateInput(event) {
    let inputField = document.getElementById(event.target.id);
    inputField.value = inputField.value.replace(/[^-0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

function validatePaste(e) {
    let pastedText = e.clipboardData.getData('text');
    if (/[^-0-9.]/.test(pastedText) || (/\./.test(pastedText) && pastedText.match(/\./g).length > 1)) {
        e.preventDefault();
        return false;
    }
}


function populateCategoryPanel(selDatasetId) {
    let dropDownMenu = d3.select(`#${selDatasetId}`);
    if (dataByColumn != null) {
        let keys = Object.keys(dataByColumn);
        keys.forEach(key => {
            let option1 = dropDownMenu.append('option').text(key);
            option1.attr('value', key);
        });
        // console.log('**************');
        // console.log(data['Federal Provider Number']);
    }
}


function getRadioButtonSelection(name1) {
    let selectedButton = document.querySelector(`input[name="${name1}"]:checked`).value;
    return selectedButton;
}


function getAllOrNothingRecords(l1ListOfWeightedCategories) {
    let listOfAllOrNothingCatAndValue = [];
    for (let i = 0; i < l1ListOfWeightedCategories.length; i++) {
        if (l1ListOfWeightedCategories[i]['range_All'] == 'all') {
            listOfAllOrNothingCatAndValue.push(l1ListOfWeightedCategories[i]);
        }
    }
    let setOfRecordIndices = new Set();
    for (let i = 0; i < listOfAllOrNothingCatAndValue.length; i++) {
        let category = listOfAllOrNothingCatAndValue[i]['category'];
        let value = listOfAllOrNothingCatAndValue[i]['value'];
        // console.log(`value: ${value}`);
        // console.log(`category: ${category}`);
        // console.log(`data[category][0]: ${data[category][0]}`);
        // console.log(`Object.keys(data[category]).length: ${Object.keys(data[category]).length}`);
        for (let j = 0; j < Object.keys(dataByColumn[category]).length; j++) {
            if (dataByColumn[category][j] == value) {
                setOfRecordIndices.add(j);
            }
        }
    }
    // console.log('done getting the set');
    return setOfRecordIndices;
}


function getWeightedTotals(listOfWeightedCategories, dataColumns, recordSpecificWeightTypes) {
    let recordIndicesAndWeights = {};

    if (dataColumns != null) {
        for (let i = 0; i < Object.keys(dataColumns['Federal Provider Number']).length; i++) {
            let totalRecordWeight = 0;

            for (let j = 0; j < listOfWeightedCategories.length; j++) {
                if (listOfWeightedCategories[j]['range_All'] == 'range') {
                    // console.log(`data[listOfWeightedCategories[j]['category']][${i}]): ${data[listOfWeightedCategories[j]['category']][i]}`);
                    // console.log(`parseFloat(data[listOfWeightedCategories[j]['category']][${i}]): ${parseFloat(data[listOfWeightedCategories[j]['category']][i])}`);
                    // console.log(`parseInt(listOfWeightedCategories[${j}]['weight']): ${parseFloat(listOfWeightedCategories[j]['weight'])}`);
                    if (dataColumns[listOfWeightedCategories[j]['category']][i] && String(dataColumns[listOfWeightedCategories[j]['category']][i])) {//check if not null
                        if (isDollarAmount(dataColumns[listOfWeightedCategories[j]['category']][i])) {
                            if (recordSpecificWeightTypes) {
                                listOfWeightedCategories[j]['topXWeightedValues'].push(parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i].replace('$', "")) * parseFloat(listOfWeightedCategories[j]['weight']));
                            } else {
                                totalRecordWeight += parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i].replace('$', "")) * parseFloat(listOfWeightedCategories[j]['weight']);
                            }
                        } else {
                            if (recordSpecificWeightTypes) {
                                listOfWeightedCategories[j]['topXWeightedValues'].push(parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i]) * parseFloat(listOfWeightedCategories[j]['weight']));
                            } else {
                                totalRecordWeight += parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i]) * parseFloat(listOfWeightedCategories[j]['weight']);
                            }
                        }
                    }
                } else {
                    if (String(dataColumns[listOfWeightedCategories[j]['category']][i]) == String(listOfWeightedCategories[j]['value'])) {

                        if (recordSpecificWeightTypes) {
                            // console.log(`listOfWeightedCategories[j]['totalWeightedScore']: ${listOfWeightedCategories[j]['totalWeightedScore']}`);

                            listOfWeightedCategories[j]['topXWeightedValues'].push(parseFloat(listOfWeightedCategories[j]['weight']));
                        } else {
                            totalRecordWeight += parseFloat(listOfWeightedCategories[j]['weight']);
                        }
                    }
                }
            }
            recordIndicesAndWeights[i] = totalRecordWeight;
        }
    }
    return recordIndicesAndWeights;
}


function getRecordsByIndices(indicesAndTotalsForTopX) {
    topXRecords = [];
    topXRecordColumns['totalWeightedScore'] = [];
    topXRecordColumns['index'] = [];
    for (let h = 0; h < listOfTruncatedNursingDataFrameColumns.length; h++) {
        topXRecordColumns[listOfTruncatedNursingDataFrameColumns[h]] = [];
    }
    if (dataByColumn) {
        for (let i = 0; i < indicesAndTotalsForTopX.length; i++) {
            let recordDict = {};
            let index = parseInt(indicesAndTotalsForTopX[i][0]);
            let totalWeight = indicesAndTotalsForTopX[i][1];
            recordDict['index'] = index;
            topXRecordColumns['index'].push(index);
            recordDict['totalWeightedScore'] = totalWeight;
            topXRecordColumns['totalWeightedScore'].push(totalWeight);
            for (let j = 0; j < listOfTruncatedNursingDataFrameColumns.length; j++) {
                recordDict[listOfTruncatedNursingDataFrameColumns[j]] = dataByColumn[listOfTruncatedNursingDataFrameColumns[j]][index];
                topXRecordColumns[listOfTruncatedNursingDataFrameColumns[j]].push(dataByColumn[listOfTruncatedNursingDataFrameColumns[j]][index]);
            }
            topXRecords.push(recordDict);
        }
    }

    console.log(topXRecordColumns);
    console.log(JSON.stringify(topXRecordColumns));
    console.log(topXRecords);
    console.log(JSON.stringify(topXRecords));

    // This adds totals of topX records to listOfWeightedCategories
    getWeightedTotals(listOfWeightedCategories, topXRecordColumns, true);
}


function calculateTotalWeight() {
    let topXValue = getRadioButtonSelection('topX');
    // console.log(`topXValue: ${topXValue}`);
    listOfWeightedCategories = [];
    for (let i = 0; i < categoryPanelList.length; i++) {
        let categoryNumber = categoryPanelList[i];
        let catDict = {};
        let categoryId = 'selDataset' + (categoryNumber * 2);
        let valueId = 'selDataset' + (categoryNumber * 2 + 1);
        let weightId = 'numberInput' + (categoryNumber);

        let category_value = document.getElementById(categoryId).value;
        let value_value = document.getElementById(valueId).value;
        let weight_value = document.getElementById(weightId).value;

        catDict["category"] = category_value;
        catDict["value"] = value_value;
        catDict['range_All'] = getRadioButtonSelection(`rangeAllOrNothing${categoryNumber}`);
        catDict['weight'] = weight_value;
        catDict['topXWeightedValues'] = [];
        console.log(`document.getElementById(\`range\${categoryNumber}\`): ${document.getElementById(`range${categoryNumber}`)}`);
        catDict['isTreatableAsANumber'] = !(document.getElementById(`range${categoryNumber}`).disabled);
        listOfWeightedCategories.push(catDict);
    }
    console.log(`listOfWeightedCategories: ${JSON.stringify(listOfWeightedCategories, null, 2)}`);

    // let setOfAllOrNothingRecordIndices = getAllOrNothingRecords(listOfWeightedCategories);
    // console.log(`listOfAllOrNothingRecords.size${listOfAllOrNothingRecords.size}`);
    // console.log(`listOfAllOrNothingRecords: ${listOfAllOrNothingRecords}`);
    // setOfAllOrNothingRecordIndices.forEach(value => console.log(value));
    // let dictRecordIndexAndWeightedTotal = {};
    dictRecordIndexAndWeightedTotal = getWeightedTotals(listOfWeightedCategories, dataByColumn, false);
    // console.log(`dictRecordIndexAndWeightedTotal: ${JSON.stringify(dictRecordIndexAndWeightedTotal, null, 2)}`);

    let sortedByValues = structuredClone(dictRecordIndexAndWeightedTotal);
    let entries = Object.entries(sortedByValues);
    let sortedArray = entries.sort(([, a], [, b]) => b - a);
    let sortedMap = new Map(sortedArray);
    // console.log('222999999999999999999');
    let sorted2DArray = [...sortedMap];

    // console.log(sorted2DArray);
    let count = 0;
    let topXIndicesAndTotalList = [];
    while (count < sorted2DArray.length && topXIndicesAndTotalList.length < topXValue){
        if (!Number.isNaN(sorted2DArray[count][1])){
            topXIndicesAndTotalList.push(sorted2DArray[count]);
        }
        count += 1;
    }
    let indicesAndTotalsForTopX = topXIndicesAndTotalList;
    // console.log(indicesAndTotalsForTopX);
    getRecordsByIndices(indicesAndTotalsForTopX);

}


function createBarChart() {

    let maxNameLength = Math.max(...topXRecordColumns['Provider Name'].map(name => name.length));
    // console.log(`MaxNameLength: *******${maxNameLength}`);
    // console.log(`topXRecordColumns['Provider Name']: ${topXRecordColumns['Provider Name']}`);

    let data = [{
        type: 'bar',
        x: topXRecordColumns['totalWeightedScore'],
        y: topXRecordColumns['Provider Name'],
        orientation: 'h',
        width: .8,
        marker: {
            color: 'rgba(58, 201, 80, 0.5)'  // This is an example using an RGBA value.
        }
    }];

    let catStr = "Category/ies: ";
    for (let i = 0; i < listOfWeightedCategories.length; i++) {
        catStr += listOfWeightedCategories[i].category + ', '
    }

    catStr = catStr.slice(-2, 0);

    let layout = {
        title: 'Provider Name By Total Weighted Scores',
        // width: 950,
        text: `${catStr}`,
        xaxis: {
            title: 'Total Weighted Scores'
        },
        yaxis: {
            title: 'Provider Name',
            titlestandoff: 65,
            // tickangle: -25,
            tickfont: {
                size: 10
            },
            tickprefix: '        '
        },
        margin: {
            l: (maxNameLength * 7)
        }
    };


    Plotly.newPlot('result', data, layout);
}


function sumArray(arr) {
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
        total += arr[i];
    }
    return total;
}


function createDoughnutChart() {
    let ctx = document.getElementById('categoryDoughnutChart').getContext('2d');
    let labels = [];
    let data = [];
    let backgroundColor = [];
    let borderColor = [];

    for (let i = 0; i < listOfWeightedCategories.length; i++) {
        labels.push(listOfWeightedCategories[i]['category']);
        // console.log(`listOfWeightedCategories[i]['topXWeightedValues']: ${listOfWeightedCategories[i]['topXWeightedValues']}`);
        data.push(listOfWeightedCategories[i]['topXWeightedValues'].reduce((sum, weightedValue) => sum + weightedValue, 0));
        let weightedValue = data[data.length - 1];
        // console.log(`weightedValue: ${weightedValue}`);
        backgroundColor.push(`rgba(${(Math.abs(Math.floor((weightedValue + 333) * 200))) % 256}, ${(Math.abs(Math.floor((weightedValue + 444) * 203))) % 256}, ${(Math.abs(Math.floor((weightedValue + 555) * 207))) % 256}, ${.6})`);
        borderColor.push(`rgba(${(Math.abs(Math.floor((weightedValue + 111) * 200))) % 256}, ${(Math.abs(Math.floor((weightedValue + 222) * 203))) % 256}, ${(Math.abs(Math.floor((weightedValue + 333) * 207))) % 256}, ${.6})`);
    }


    // console.log(`labels: ${labels}`);
    // console.log(`data: ${data}`);
    // console.log(`backgroundColor: ${backgroundColor}`);

    if (doughnutChartWeightedTotals) {
        doughnutChartWeightedTotals.destroy();
    }

    doughnutChartWeightedTotals = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            cutoutPercentage: 50,
            responsive: true
        }
    });

}


function createCorrelationsChart() {
    let ctx = document.getElementById('correlationsChart').getContext('2d');
    console.log('Inside correlations&&&&&&&&&&');
    let data = [];
    let listOfCategories = [];
    let labels = [];
    let backgroundColor = [];
    let borderColor = [];

    for (let i = 0; i < listOfWeightedCategories.length; i++) {
        if (listOfWeightedCategories[i]['isTreatableAsANumber']) {
            listOfCategories.push(listOfWeightedCategories[i]['category']);
        }
    }

    for (let j = 0; j < listOfCategories.length; j++) {
        let currentCategory = listOfCategories[j];
        // Search for correct row
        for (let k = 0; k < correlationsByRow.length; k++) {
            console.log(`correlationsByRow[k]['Column Of Category']: ${correlationsByRow[k]['Column Of Category']}`);
            console.log(`listOfCategories[j]: ${listOfCategories[j]}`);
            if (correlationsByRow[k]['Column Of Category'] == currentCategory) {
                let correlTableRow = correlationsByRow[k];
                for (let m = j; m < listOfCategories.length; m++) {
                    let secondCurrentCategory = listOfCategories[m];
                    if (currentCategory == secondCurrentCategory) {
                        continue;
                    }
                    let correlationCoefficient = correlTableRow[secondCurrentCategory];
                    // console.log(`correlTableRow[secondCurrentCategory]: ${correlTableRow[secondCurrentCategory]}`);
                    // console.log(`correlTableRow: ${JSON.stringify(correlTableRow)}`);
                    // console.log(`secondCurrentCategory: ${secondCurrentCategory}`);
                    data.push(correlationCoefficient);
                    labels.push(`${currentCategory} -- ${secondCurrentCategory}`);

                    backgroundColor.push(`rgba(${(Math.abs(Math.floor((correlationCoefficient + 333) * 200))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 444) * 203))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 555) * 207))) % 256}, ${.6})`);
                    borderColor.push(`rgba(${(Math.abs(Math.floor((correlationCoefficient + 111) * 200))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 222) * 203))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 333) * 207))) % 256}, ${.6})`);
                }

                console.log(`data: ${data}`);
                console.log(`labels: ${labels}`);


                break;
            }

        }
    }

    if (correleationsCategoryChart) {
        correleationsCategoryChart.destroy();
    }
    console.log(`correlationsByRows: ${JSON.stringify(correlationsByRow)}`)
    correleationsCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Correlations Between Selected Categories',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    },);
}


function buttonClicked(button) {
    if (button == 'addCategory') {
        addCategoryPanel();

        populateCategoryPanel(`selDataset${(categoryCount - 1) * 2}`);
        populateValuesOfCategory(`selDataset${(categoryCount - 1) * 2}`);
    } else if (button == 'calculateTotal') {

        listOfWeightedCategories = [];
        calculateTotalWeight();
        createWeightedMap();
        createBarChart();
        createCategoryChart();
        createDoughnutChart();
        createCorrelationsChart();


    } else if (button.includes('removeCategoryButton')) {
        removeCategoryButton(button);
    }
}


function removeCategoryButton(button) {
    let categoryElementIdNumber = button.replace('removeCategoryButton', '');
    d3.select(`#category${categoryElementIdNumber}`).remove();
    let indexOfCategoryElementToRemove = categoryPanelList.indexOf(parseInt(categoryElementIdNumber));
    // console.log(`categoryPanelList: ${categoryPanelList}`);
    categoryPanelList.splice(indexOfCategoryElementToRemove, 1);
    // console.log(`categoryPanelList: ${categoryPanelList}`);
}


function optionChangedValue(value_key) {
    // console.log('In optionChangedValue');
}

// Fucntion to be called every time a new id is selected from the dropdown menu. When this funciton
// is called it executes the process that displays the data for the new person selected.
function optionChangedCategory(category_key) {
    if (dataByColumn != null) {

        let selectElement = category_key.target;
        populateValuesOfCategory(selectElement.id);
    }
}


function addButtons() {
    let lowerDiv = d3.select('#lowerDiv');
    let buttonDiv = lowerDiv.append('div');
    buttonDiv.attr('class', 'col-md-6');
    buttonDiv.attr('style', "margin-top: 10px !important;");
    buttonDiv.attr('id', 'addCalcButtonDiv');

    let buttonContainer = d3.select('#addCalcButtonDiv').append('div');
    buttonContainer.attr('id', 'addCalcButtonContainer');

    let addCalcButtonContainer = d3.select('#addCalcButtonContainer');
    let addButton = addCalcButtonContainer.append('button');
    addButton.attr('id', 'addCategory');
    addButton.attr('style', 'margin: 0px 6px 14px 2px; box-shadow: 0px 3px 4px 0px;');
    addButton.attr('onclick', 'buttonClicked("addCategory")');
    addButton.html('Add Category');

    let calcButton = addCalcButtonContainer.append('button');
    calcButton.attr('id', 'calculateTotal');
    calcButton.attr('style', 'margin: 0px 6px 14px 2px; box-shadow: 0px 3px 4px 0px;');
    calcButton.attr('onclick', 'buttonClicked("calculateTotal")');
    calcButton.html('Calculate Total');
}


function addCategoryPanel() {
    // let categoriesDiv = d3.select('.categories');
    let categoryDiv = d3.select('#categories').append('div');
    categoryDiv.attr('class', 'col-md-12 category');
    categoryDiv.attr('style', `margin: 4px 0px;`);

    categoryDiv.attr('id', `category${categoryCount}`);
    // categoryDiv.attr('style', 'background-color: green;');

    // categoryDiv.innerHMTL = 'hi';

    let subcategoryDiv = d3.select(`#category${categoryCount}`).append('div');
    subcategoryDiv.attr('class', 'well');
    subcategoryDiv.attr('id', `subcategory${categoryCount}`);
    subcategoryDiv.attr('style', "box-shadow: 0px 3px 4px; ");

    let subcategoryDivContainer = d3.select(`#subcategory${categoryCount}`);
    let removeCategoryButton = subcategoryDivContainer.append('button');
    removeCategoryButton.attr('id', `removeCategoryButton${categoryCount}`);
    removeCategoryButton.attr('style', 'position: relative; left: 95%; top: 0px; margin-top: 0px; box-shadow: 0px .5px 1px 0px; font-size: .8rem;'); //border: 1px solid #000;')
    removeCategoryButton.attr('onclick', `buttonClicked("removeCategoryButton${categoryCount}")`);
    removeCategoryButton.html('X');

    let form = subcategoryDivContainer.append('form');
    form.attr('id', `form${categoryCount}`);
    document.getElementById(`form${categoryCount}`).addEventListener("submit", function (e) {
        e.preventDefault();
    });



    let hCat = form.append('h4');
    hCat.html('Category:');
    hCat.attr('style', 'font-weight: 600;')

    // form.append('br');

    // console.log('%%%%%%%%%%%%%%%%');
    // console.log(categoryCount);
    let select1 = form.append('select');
    select1.attr('id', `selDataset${categoryCount * 2}`);
    select1.attr('onchange', "optionChangedCategory(event)");

    form.append('br');

    let hValue = form.append('h5');
    hValue.attr('style', 'font-weight: 600;')
    hValue.html('Value:');

    let select2 = form.append('select');
    select2.attr('id', `selDataset${categoryCount * 2 + 1}`);
    select2.attr('onchange', "optionChangedValue(event)");

    form.append('br');

    let label3 = form.append('label')
    label3.attr('style', "margin-top: 10px; font-size: 10px;");
    label3.html('Value as range: &lpar; value X weight &rpar;');

    let input3 = form.append('input');
    input3.attr('type', 'radio');
    input3.attr('style', 'margin-left: 4px;');
    input3.attr('id', `range${categoryCount}`);
    input3.attr('name', `rangeAllOrNothing${categoryCount}`);
    input3.attr('value', 'range');
    input3.property('checked', true);

    // document.getElementById(`range${categoryCount}`).addEventListener("change", function() {
    //     if (this.checked) {
    //         document.getElementById(`selDataset${categoryCount * 2 + 1}`).disabled = true;
    //     }
    // });

    form.append('br');

    let label4 = form.append('label')
    label4.attr('style', "font-size: 10px;");
    label4.html('&emsp;Value as All-Or-Nothing: &lpar; value/value X weight &rpar;');

    let input4 = form.append('input');
    input4.attr('type', 'radio');
    input4.attr('style', 'margin-left: 4px;');
    input4.attr('id', `all${categoryCount}`);
    input4.attr('name', `rangeAllOrNothing${categoryCount}`);
    input4.attr('value', 'all');

    // document.getElementById(`all${categoryCount}`).addEventListener("change", function() {
    //     if (this.checked) {
    //         document.getElementById(`selDataset${categoryCount * 2 + 1}`).disabled = false;
    //     }
    // });



    form.append('br');


    let label5 = form.append('label')
    label5.attr('style', "font-size: 16px; margin-right: 4px;");
    label5.html('Weight: ');

    let input5 = form.append('input');
    input5.attr('type', 'text');
    input5.attr('id', `numberInput${categoryCount}`);
    input5.attr('oninput', "validateInput(event)");
    input5.attr('onpaste', "return validatePaste(event)");

    categoryPanelList.push(categoryCount);
    // console.log(`categoryPanelList: ${categoryPanelList}`);
    categoryCount += 1;

}


function getColors(numOfColorSteps, seed, alpha) {
    let colors1 = [];
    for (let i = 0; i < numOfColorSteps; i++) {
        colors1.push(getRGBAString(i, Math.random() * seed, alpha));
    }
    return colors1;
}


function createMarkers(dataRow, myMap) {
    let features = [];

    for (let i = 0; i < dataRow.length; i++) {
        let feature = {};
        feature['type'] = 'Feature';
        feature['properties'] = dataRow[i];
        feature['geometry'] = {
            type: 'Point',
            coordinates: [dataRow[i].Longitude, dataRow[i].Latitude]
        };
        features.push(feature);
    }
    let distributionMax;
    let distributionMin;
    let delta;
    let numOfColorSteps = 6;

    let colors1 = getColors(numOfColorSteps, 1000, 0.6);



    if ('totalWeightedScore' in features[0].properties) {
        distributionMax = features[0].properties['totalWeightedScore'];
        distributionMin = features[0].properties['totalWeightedScore'];
        for (let i = 0; i < features.length; i++) {
            if (features[i].properties['totalWeightedScore'] > distributionMax) {
                distributionMax = features[i].properties['totalWeightedScore'];
            }
            if (features[i].properties['totalWeightedScore'] < distributionMin) {
                distributionMin = features[i].properties['totalWeightedScore'];
            }
        }
    } else {
        distributionMax = features[0].properties['Overall Rating'];
        distributionMin = features[0].properties['Overall Rating'];
        for (let i = 0; i < features.length; i++) {
            if (features[i].properties['Overall Rating'] > distributionMax) {
                distributionMax = features[i].properties['Overall Rating'];
            }
            if (features[i].properties['Overall Rating'] < distributionMin) {
                distributionMin = features[i].properties['Overall Rating'];
            }
        }
    }



    if (distributionMax != distributionMin) {
        if ((distributionMax - distributionMin) >= numOfColorSteps) {
            delta = (distributionMax - distributionMin) / numOfColorSteps;
        } else {
            delta = 1;
        }
    }


    // console.log(`features:\n${JSON.stringify(features)}`);
    // Create a geoJSON layer to add markers to map.
    L.geoJSON(features, {

        // Use the pointToLayer option of a geoJSON layer to create a 
        // circleMarker with a radius that's proportional to the 
        // magnitude of the earthquake and has a color that corresponds 
        // to a particular depth range (in km). (It also sets an 
        // opacity, fillOpacity, and wieght that are constant across 
        // all markers).
        pointToLayer: function (feature, latlng) {
            let ranking = 0;
            let fillColor1 = "";

            if ('totalWeightedScore' in feature.properties) {
                ranking = feature.properties['totalWeightedScore'];
            } else {
                ranking = feature.properties['Overall Rating'];
            }
            // let magnitude = feature.properties.mag;
            // console.log(`Math.floor((ranking-distributionMin) * delta): ${Math.floor((ranking - distributionMin) * delta)}`);
            let diffMaxMin = distributionMax - distributionMin;
            if (diffMaxMin <= 5) {
                fillColor1 = colors[Math.floor(5 - (distributionMax - ranking))];
            } else {
                if (ranking == distributionMax) {
                    fillColor1 = colors[colors.length - 1];
                } else {
                    // console.log(`Math.floor((ranking - distributionMin) / delta): ${Math.floor((ranking - distributionMin) / delta)}`);
                    fillColor1 = colors[Math.floor((ranking - distributionMin) / delta)];
                }
            }

            // To assure fillColor1 always has a color
            if (!colors.includes(fillColor1)) {
                fillColor1 = colors[0];
            }


            markerOptions = {
                opacity: 1,
                fillOpacity: 0.65,
                color: 'black',
                weight: .3,
                fillColor: fillColor1,
                radius: 5//magnitude * 3 
            };
            return L.circleMarker(latlng, markerOptions);
        },

        // Use the onEachFeature option of a geoJSON layer to bind a
        // popup tag/box for each marker that displays the information
        // specific to that marker such as maginitude, depth, location,
        // place, and time.
        onEachFeature: function (feature, layer) {
            // let depth = feature.geometry.coordinates[2];
            let latLng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
            // let magnitude = feature.properties.mag;
            // let place = feature.properties.place;
            // let time = feature.properties.time;


            if ('totalWeightedScore' in feature.properties) {
                layer.bindPopup(`<span style='font-size: 14px;'><strong>${feature.properties['Provider Name']}:<br>${feature.properties['Provider City']}, ${feature.properties['Provider State']}</strong><hr>Latitude: ${latLng[0].toFixed(3)}, Longitude: ${latLng[1].toFixed(3)}<br>Total Weighted Score: ${feature.properties['totalWeightedScore'].toFixed(3)}</span>`).addTo(myMap);
            } else {
                layer.bindPopup(`<span style='font-size: 14px;'><strong>${feature.properties['Provider Name']}:<br>${feature.properties['Provider City']}, ${feature.properties['Provider State']}</strong><hr>Latitude: ${latLng[0].toFixed(3)}, Longitude: ${latLng[1].toFixed(3)}<br>Overall Ratings: ${feature.properties['Overall Rating']} <br>Processing Date: ${feature.properties['Processing Date']}</span>`).addTo(myMap);
            }
        }
    }).addTo(myMap);
}


function removeAllMapMarkers() {
    console.log('removing markers');
    myMap.eachLayer(function (layer) {
        if (layer instanceof L.CircleMarker) {
            myMap.removeLayer(layer);
            console.log('removing markers');
            return;
        }
    });
    myMap.remove()
    let stepLabels = ['Least', '&emsp;.', '&emsp;.', '&emsp;.', '&emsp;.', 'Greatest'];
    createMap(topXRecords, 'Weighted Total', stepLabels);

}



function createWeightedMap() {
    removeAllMapMarkers();
    createMarkers(topXRecords, myMap);

}

function createLegend(myMap, legendLabels, legendTitle) {
    // Create L.Control object for the legend
    let legend = L.control({ position: 'bottomright' });

    // Implementing .onAdd method for the L.Control object
    legend.onAdd = function () {
        // Create a div to conatain the legend
        let div = L.DomUtil.create('div', 'legend');

        // Style the legend-div with a white background, a margin that is aesthetically appealling
        // (subjectively, of course), and round the corners of the div
        div.setAttribute('style', 'background-color: white; margin-left: 0px; padding: 0px 10px 0px 0px; border-radius: 5px;');
        let labels = [];


        // Create a string filled with html code to construct the legend-- primarily relying on a
        // unordered list and its elements
        let legendHTMLString = `<div style='padding: 4px; font-size: 1.2rem;'><strong>&emsp;${legendTitle}</strong><br><ul style=\"list-style-type: none; padding-left: 10px;\">`;
        for (let i = 0; i < colors.length; i++) {

            legendHTMLString += `<li><span style=\"background-color: ${colors[i]};\">&emsp;</span> ${legendLabels[i]}</li>`;

        }

        legendHTMLString += "</ul></div>";

        // Implement the string as html code
        div.innerHTML = legendHTMLString;

        // Return the fabricated div tag
        return div;
    }

    // Add the legend to the map
    legend.addTo(myMap);
}


function createMap(dataRows, legendTitle, stepLabels) {
    // console.log(`dataRows: \n${dataRows}`);
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })

    myMap = L.map("map1", {
        center: [
            37, -100
        ],
        zoom: 4,
        layers: [street]
    });

    // Create and add the markers to the map
    createMarkers(dataRows, myMap);


    // Create and the markers to the map
    createLegend(myMap, stepLabels, legendTitle);
}


function getRGBAString(value, initialSeed, alpha) {
   return `rgba(${(Math.abs(Math.floor((value + initialSeed + 333) * 200))) % 256}, ${(Math.abs(Math.floor((value + initialSeed + 444) * 203))) % 256}, ${(Math.abs(Math.floor((value + initialSeed + 555) * 207))) % 256}, ${alpha})`;
}


function createCategoryChart() {

    // console.log('1');
    let arrOfTraces = [];
    for (let h = 0; h < listOfWeightedCategories.length; h++) {
        console.log(`color${h}: ${getRGBAString(h, h + 390, 0.5)}`);
        console.log(`color${h}: ${getRGBAString(h, h + 390, 0.8)}`);
        let trace = {
            type: 'bar',
            opacity: 0.6,
            marker: {
                color: getRGBAString(h, h + 390, 0.7),  // Bar values
                line: {
                    color: getRGBAString(h, h + 390, 1),
                }  // Using the Viridis color scale
            }
        };
        let x = topXRecordColumns['Provider Name'];
        trace['x'] = x;
        let category = listOfWeightedCategories[h].category;
        // console.log('2');
        trace['name'] = category;
        // console.log(JSON.stringify(trace));
        // break;
        let y = [];
        let text = [];
        for (let i = 0; i < topXRecords.length; i++) {
            let value = topXRecordColumns[category][i];
            text.push(`Value: ${value}`);
            // console.log('2');
            // console.log(`value: ${value}`);
            let range_all = listOfWeightedCategories[h].range_All;
            // console.log(`listOfWeightedCategories[h].range_All: ${listOfWeightedCategories[h].range_All}`);
            if (range_all == 'range') {
                // console.log('5');

                y.push(parseFloat(value) * parseFloat(listOfWeightedCategories[h].weight));
            } else if (String(value) == String(listOfWeightedCategories[h].value)) {
                // console.log('6');
                y.push(parseFloat(listOfWeightedCategories[h].weight));
            } else {
                // console.log('7');
                y.push(0);
            }
        }
        trace['y'] = y;
        trace['text'] = text;
        console.log(JSON.stringify(trace));
        // break;
        arrOfTraces.push(trace);
    }
    console.log(JSON.stringify(arrOfTraces));


    // let data = [trace1, trace2];

    // Layout settings
    let layout = {
        title: 'Category Weight Contribution By Provider',
        barmode: 'group',
        yaxis: {
            title: 'Category Weight Contribution'
        },
        margin: {
            b: 200
        }
    };

    // Plot the chart
    Plotly.newPlot('groupedChart', arrOfTraces, layout);
}








d3.json(urlJSONCorrelationsByRow).then(function (correlationsData) {
    correlationsByRow = structuredClone(correlationsData);
}

);



d3.json(urlJSONByRow).then(function (dataRows) {
    dataByRow = structuredClone(dataRows);
    console.log('Data by Row: ');
    console.log(dataRows);
    createMap(dataRows, 'Overall Rating', ['null', 1,2,3,4,5]);

});

d3.json(urlJSONByColumn).then(function (dataColumns) {
    dataByColumn = structuredClone(dataColumns);
    // console.log(bootstrap.Tooltip.VERSION);

    // Quick printout-sanity-check
    console.log('Data by Column:');
    console.log(dataColumns);

    function initialize() {
        addCategoryPanel();

        let dropDownMenu = d3.select('#selDataset0');
        let keys = Object.keys(dataColumns);
        keys.forEach(key => {
            // console.log(key);
            let option1 = dropDownMenu.append('option').text(key);
            option1.attr('value', key);
        });
        console.log('**************');
        // console.log(data1['Federal Provider Number']);

        populateValuesOfCategory('selDataset0');

        addButtons();
    }

    initialize();


});