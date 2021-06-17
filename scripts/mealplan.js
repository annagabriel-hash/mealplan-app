/*********************************** 
  || Table of Contents          ||
  ||  A. Variables              ||      
  ||  B. Class                  ||   
  ||  C. Functions              ||    
  ||  D. Event Listeners        ||    
***********************************/

/* =====================
    A. VARIABLES
  ====================== 
*/
let activeUser; // loggedIn user object
const users = []; // To store list of users
let recipesInfo = []; // To store recipes instead of requesting the recipe information via API
let mealsSearchList = {}; // results for the meal

const FORM = {
	init() {
		FORM.fridgeFormListeners();
		FORM.mealFormListeners();
	},
	fridgeFormListeners() {
		let form = document.forms['fridgeForm'];
		let ingredient = form.elements['fridgeitem'];
		// After changing whole value
		ingredient.addEventListener('change', FORM.formatStrToLower);
		ingredient.addEventListener('change', FORM.testFridgeInput);

		// Error during validation
		ingredient.addEventListener('invalid', FORM.fail);

		// When the form gets submitted
		form.addEventListener('submit', (ev) => {
			// 1. Validate form details
			let isValid = FORM.validateForm(ev);
			// Form elements are valid
			if (isValid) {
				// 1. Create new fridge item
				activeUser.addFridgeList(ingredient.value);
				// 2. Display fridge list
				displayFridgeLI(ingredient.value);
				// 3. Reset form
				form.reset();
				setInputValidationMsg(ingredient);
			}
		});
	},
	mealFormListeners() {
		let form = document.forms['mealForm'];

		// When the form gets submitted
		form.addEventListener('submit', async (ev) => {
			ev.preventDefault();
			// 1. Get checked ingredients
			let getCheckedIngred = form.querySelectorAll('input:checked');
			/** @type {Array<string>} - ingredients as search query for the recipes */
			let ingredients = Array.prototype.map.call(getCheckedIngred, ({ value }) => value);
			// 3. Request in API the meals that can be cooked
			await mealSearch(ingredients);
			// 4. Extract mealSearch Ids
			let recipeSearchIds = activeUser.mealsSearchList.map(({ id }) => id);
			// 5. Check which are not in the cache
			let recipeCacheIds = extractIds(recipesInfo);
			recipeSearchIds = recipeSearchIds.filter((id) => !recipeCacheIds.includes(id));
			// 6. Search recipe information
			await recipeInfoSearch(recipeSearchIds);
			// 7. Display recipe information
			activeUser.mealsSearchList.forEach((mealResult) => {
				displaymealSearch(mealResult);
			});
		});
	},
	formatStrToLower(ev) {
		let field = ev.target;
		field.value = field.value.toLowerCase().trim();
	},
	testFridgeInput(ev) {
		let field = ev.target;
		fridgeItem = field.value;
		// Reset error
		field.setCustomValidity('');
		// Fridge Item already existing
		activeUser.fridgeList.includes(fridgeItem) && field.setCustomValidity('Fridge ingredient already exist. Please input another ingredient');
	},
	fail(ev) {
		let field = ev.target;
		// The invalid event fired
		setInputValidationMsg(field, 'error', field.validationMessage);
	},
	/**
	 * Check if input value has passed constraints and displays the validation message
	 * @param {HTMLElement} inputElem - input element
	 */
	validateInputs(inputElem) {
		setInputValidationMsg(inputElem, 'reset');
		let isValid = inputElem.checkValidity();
		// Runs the success message.
		// Error messages are already included in the invalid event listener
		isValid && setInputValidationMsg(inputElem, 'success');
	},
	/**
	 * Validates the form input elements
	 * @param {HTMLElement} ev - form element
	 * @returns {boolean} - returns true if the input elements in the form are valid; otherwise it returns false
	 */
	validateForm(ev) {
		let form = ev.target;
		let inputElems = form.querySelectorAll('input');
		ev.preventDefault();
		// 2. Validate input elements and show message
		inputElems.forEach((inputElem) => FORM.validateInputs(inputElem));
		return form.checkValidity();
	},
};
FORM.init();
/* =====================
		B. CLASSES
	====================== 
*/
/** Class representing a new user */
class User {
	/**
	 * Creates a new user
	 * @param {string} username - username
	 * @param {string} firstName - first name of user (in uppercase)
	 * @param {string} lastName - last name of user (in uppercase)
	 * @param {string} email - email of user
	 * @param {string} password -  password of user
	 */
	constructor(username, firstName, lastName, email, password) {
		this.username = username;
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		this.password = password;
		this.fridgeList = [];
		this.mealsSearchList = [];
		this.mealPlans = [];
	}
	addMealPlan(mealId) {
		this.mealPlans.push(mealId);
	}
	removeMealPlan(mealIds) {
		let updatedMealPlan = this.mealPlan.filter((meal) => mealIds.includes(meal));
		return updatedMealPlan;
	}
	addFridgeList(item) {
		this.fridgeList.push(item);
	}
	/**
	 * This function stores the API result in the user object
	 * @param {Object} mealSearchResult - result from JSON
	 */
	addMealSearchList(mealSearchResult) {
		this.mealsSearchList = mealSearchResult;
	}
}

/* =====================
    C. FUNCTIONS
  ====================== 
*/
/**
 * Stores HTMLform data in an object using the form name as object keys and values as the object values and RETURNS the object
 * For example, <input name="firstname" value="anna"> will return object.firstname = 'anna';
 * @param {HTMLElement} formElem - form element
 * @returns {{inputname: inputvalue}} - returns form with the input name as object key and input value the object value
 *
 */
function storeFormData(formElem) {
	let formData = {};
	// 1. Find input elements
	// Use call function since filter is not available for HTML Collection
	let getInputs = [].filter.call(formElem.elements, (el) => el.nodeName === 'INPUT');
	// 2. Store data in the object. If there is no name, it will not store the data;
	// Utilizes the input name and value attributes to get the name and value
	getInputs.forEach(({ name, value }) => name && (formData[name] = value));
	return formData;
}
/**
 * Show validation message in the input HTML element
 * @param {HTMLElement} getInput - input element
 * @param {string} [type="reset"] - Set the type of message (success/error/reset). Default value = 'reset'
 * @param {string} [message] - error message to show to user
 */
function setInputValidationMsg(getInput, type = 'reset', message) {
	// 1. Get the input group and error message
	const getFormGrp = getInput.parentElement;
	const getErrMsg = getFormGrp.querySelector('small');
	if (type === 'reset') {
		getFormGrp.classList.remove('success');
		getFormGrp.classList.remove('error');
	} else if (type === 'success') {
		getFormGrp.classList.remove('error');
		getFormGrp.classList.add('success');
	} else if (type === 'error') {
		// Add error message in HTML
		getErrMsg.textContent = message;
		getFormGrp.classList.add('error');
	}
}

/**
 *
 * @param {string|Object} userInfo - If search is to be performed, enter the username; otherwise, enter the user information (object)
 * @param {string} [action='search'] - Set action to perform: search/create
 */
function maintainUser(userInfo, action = 'search') {
	if (action === 'search') {
		let userSearch = users.find((user) => user.username === userInfo);
		return userSearch;
	} else if (action === 'create') {
		let { username, firstName, lastName, email, password } = userInfo;
		// Add to list of users
		users.push(new User(username, firstName, lastName, email, password));
		console.log('User created');
	}
}
/**
 * Async function that request via API the meals that can be cooked from the ingredients(array) provided
 * @param {Array<string>} ingredients - ingredients list
 * @returns {Promise} - Promise object representing result of meal search
 */
async function mealSearch(ingredients) {
	/** @type {string} - This is the requestURL when searching for recipes by ingredient */
	let requestUrl = 'https://api.spoonacular.com/recipes/findByIngredients?apiKey=0855fbcbcef446e3adcc091dd8a16aff';
	/** @type {string} - This is the comma separated list of ingredients for the search query	 */
	let ingredientReq = `ingredients=${ingredients.join(',')}`;
	/** @type {string} - Maximum number of results to be returned. The default is 10 to limit request	 */
	let maxHitsReq = `number=10`;
	/** @type {string} - Request url considering the search query */
	let url = `${requestUrl}&${ingredientReq}&${maxHitsReq}`;
	try {
		// 1. Fetch data in API
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		// 2. Store data
		const data = await response.json();
		activeUser.addMealSearchList(data);
		console.log('3. Request in API the meals that can be cooked\nDone fetching recipe info');
	} catch (error) {
		console.log(error);
	}
}
/**
 * Async function that searches for the recipe information
 * Updates the activeUser.searchlist
 * @param {Array<string>} recipes - recipe ids for searching recipe
 * @returns {Promise}  - Promise object representing result of recipe search
 */
async function recipeInfoSearch(recipes) {
	let requestUrl = 'https://api.spoonacular.com/recipes/informationBulk?apiKey=0855fbcbcef446e3adcc091dd8a16aff';
	let idsReq = `ids=${recipes.join(',')}`;
	let url = `${requestUrl}&${idsReq}`;
	// 1. Fetch data in API
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		// 2. Store data
		const data = await response.json();
		updateRecipeInfo(data);
	} catch (error) {
		console.log(err);
	}
}
function createLI(content) {
	const newLI = document.createElement('li');
	newLI.textContent = content;
	return newLI;
}
function displayFridgeLI(ingredient) {
	const getFridgeList = document.querySelector('#list-fridge');

	let counter = activeUser.fridgeList.length;
	// 1. Create elements
	const newLI = document.createElement('li');
	newLI.className = 'input-grp custom-checkbox';

	const newInput = document.createElement('input');
	Object.assign(newInput, {
		type: 'checkbox',
		name: 'ingredient',
		id: `opt${counter}`,
		value: ingredient,
	});

	const newLabel = document.createElement('label');
	newLabel.setAttribute('for', `opt${counter}`);
	newLabel.textContent = ingredient;

	// 2. Append elements
	newLI.appendChild(newInput);
	newLI.appendChild(newLabel);
	getFridgeList.appendChild(newLI);
}
// function to display meal search
function displaymealSearch(mealSearch) {
	let recipeInfo = recipesInfo.find((recipes) => recipes.id === mealSearch.id);
	// 1. Create elements
	const newRecipeLI = document.createElement('li');
	newRecipeLI.className = 'card';
	// Recipe Image
	const newRecipeImg = document.createElement('img');
	newRecipeImg.setAttribute('src', recipeInfo.image);
	newRecipeImg.setAttribute('alt', 'recipe-pic');
	newRecipeImg.className = 'card-img';

	// Recipe Title
	const newRecipeTitle = document.createElement('p');
	newRecipeTitle.className = 'card-title';
	newRecipeTitle.textContent = recipeInfo.title;

	// Recipe Description
	const newRecipeDescDiv = document.createElement('div');
	newRecipeDescDiv.className = 'd-flex';
	newRecipeDescDiv.appendChild(displayRecipeDesc(recipeInfo.readyInMinutes, recipeInfo.servings));
	newRecipeDescDiv.appendChild(displayDishTypes(recipeInfo.dishTypes));
	newRecipeDescDiv.appendChild(displayMissingIngredients(mealSearch.missedIngredientCount));

	// Recipe Content
	const newRecipeContentDiv = document.createElement('div');
	newRecipeContentDiv.className = 'pt-1 d-flex';
	newRecipeContentDiv.appendChild(newRecipeTitle);
	newRecipeContentDiv.appendChild(newRecipeDescDiv);

	// Recipe Buttons
	const newRecipeBtns = displayRecipeBtns(recipeInfo.sourceUrl);

	// 2. Append to recipe list
	let getRecipeList = document.querySelector('#meal-search-list');
	newRecipeLI.appendChild(newRecipeImg);
	newRecipeLI.appendChild(newRecipeContentDiv);
	newRecipeLI.appendChild(newRecipeBtns);
	getRecipeList.appendChild(newRecipeLI);
}

function displayRecipeDesc(mins, servings) {
	let strMins = mins > 1 ? `${mins} mins` : `${mins} min`;
	let strServings = servings > 1 ? `${servings} servings` : `${servings} serving`;
	const newUL = document.createElement('ul');
	newUL.className = 'dot-separator text-sm';

	newUL.appendChild(createLI(strMins));
	newUL.appendChild(createLI(strServings));

	return newUL;
}
function displayDishTypes(dishTypes) {
	const newUL = document.createElement('ul');
	newUL.className = 'dot-separator text-sm';

	dishTypes.forEach((dishtype) => {
		// Convert to dishtype to proper case
		let formatdishtype = dishtype[0].toUpperCase() + dishtype.substring(1);
		// Create HTML list element and append
		newUL.appendChild(createLI(formatdishtype));
	});
	return newUL;
}
function displayMissingIngredients(missingIngredientCount) {
	let formatIngredientCount = missingIngredientCount > 1 ? `${missingIngredientCount} missing ingredients` : `${missingIngredientCount} missing ingredient`;
	// Create HTML element
	const newPar = document.createElement('p');
	newPar.className = 'text-sm';
	newPar.textContent = formatIngredientCount;

	return newPar;
}
function displayRecipeBtns(recipeLink) {
	const newDiv = document.createElement('div');
	newDiv.className = 'btn-grp d-flex f-row';

	const newBtn = document.createElement('button');
	newBtn.setAttribute('type', 'button');
	newBtn.className = 'btn mr-1';
	newBtn.textContent = 'Save';

	const newLink = document.createElement('a');
	Object.assign(newLink, {
		href: recipeLink,
		className: 'btn',
		target: '_blank',
		rel: 'noreferrer noopener',
		textContent: 'View',
	});
	newDiv.appendChild(newBtn);
	newDiv.appendChild(newLink);

	return newDiv;
}

function updateRecipeInfo(newRecipeInfo) {
	recipesInfo = [...recipesInfo, ...newRecipeInfo];
	return recipesInfo;
}
function extractIds(recipesList) {
	return recipesList.map(({ id }) => id);
}
// Test Data
recipesInfo = JSON.parse(localStorage.getItem('recipesInfo'));
mealsSearchList = JSON.parse(localStorage.getItem('mealsSearchList'));
let testUser = {
	username: 'AGABRIEL',
	firstName: 'ANNA',
	lastName: 'GABRIEL',
	email: 'yssg@g.com',
	password: '1234',
};
maintainUser(testUser, 'create');
activeUser = maintainUser('AGABRIEL');
activeUser.addFridgeList('apples');
activeUser.addFridgeList('banana');
activeUser.addFridgeList('flour');
activeUser.addFridgeList('cinnamon');
