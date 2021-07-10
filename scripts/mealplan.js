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
let activeUser;
const users = []; // To store list of users
let recipesInfo = []; // To store recipes instead of requesting the recipe information via API
let mealsSearchList = {}; // results for the meal
let currentTab = 0; // To set what tabs to view in the Sign up page

const FORM = {
	init() {
		FORM.loginFormListeners();
		FORM.signUpFormListeners();
		FORM.navBarListeners();
		FORM.fridgeFormListeners();
		FORM.mealFormListeners();
		FORM.mealPlanListeners();
	},
	loginFormListeners() {
		let form = document.forms['loginForm'];
		let username = form.elements['username'];
		let password = form.elements['password'];
		const getSignUpLink = document.querySelector('#signup-link');
		const getPrevBtn = document.querySelector('#prevBtn');
		const getLoginPg = document.querySelector('#sec-login');
		const getMainPg = document.querySelector('.tab');
		const getNav = document.querySelector('.nav-bar');
		const getNotif = document.querySelector('.alert');
		// While typing
		username.addEventListener('input', FORM.formatStrToUpper);

		// When there is an error during validation
		username.addEventListener('invalid', FORM.fail);
		password.addEventListener('invalid', FORM.fail);

		// When the form gets submitted
		form.addEventListener('submit', (ev) => {
			// 1. Validate form details
			let isValid = FORM.validateForm(ev);
			if (isValid) {
				// 2. Reset form and fields
				let inputElems = form.querySelectorAll('input');
				inputElems.forEach((inputElem) => setInputValidationMsg(inputElem, 'reset'));
				form.reset();
				currentTab = 0;
				// 3. Hide login
				getLoginPg.classList.add('d-none');
				// 4. Display navigation
				getMainPg.classList.add('active');
				// 5. Display main pages
				getNav.classList.add('active');
				showNotif('Login successful', 'success');
			}
		});

		// On click
		getNotif.addEventListener('click', (ev) => (getNotif.className = 'alert'));

		// FOR NEW USERS
		// Upon clicking of sign-up link
		getSignUpLink.addEventListener('click', () => {
			// 1. Show sign up page
			let getSignUpPage = document.querySelector('#sec-newusr');
			getSignUpPage.classList.remove('d-none');
			getPrevBtn.style.visibility = 'hidden';
		});
	},
	signUpFormListeners() {
		const getPrevBtn = document.querySelector('#prevBtn');
		const getNextBtn = document.querySelector('#nextBtn');
		const getNewUsrTabs = document.querySelectorAll('#newUserForm > fieldset');
		let form = document.forms['newUserForm'];
		let inputElems = form.querySelectorAll('input');
		let firstname = form.elements['firstName'];
		let lastname = form.elements['lastName'];
		let newUsername = form.elements['username'];
		let chkpassword = form.elements['chkpassword'];

		// After changing whole value
		firstname.addEventListener('change', FORM.formatStrToUpper);
		lastname.addEventListener('change', FORM.formatStrToUpper);
		inputElems.forEach((inputElem) => inputElem.addEventListener('change', FORM.validateInputs(inputElem)));
		newUsername.addEventListener('change', (ev) => {
			FORM.formatStrToUpper(ev);
			FORM.testNewUser(ev);
		});
		chkpassword.addEventListener('change', FORM.testNewPassword);

		// When there is an error during validation
		inputElems.forEach((inputElem) => inputElem.addEventListener('invalid', FORM.fail));

		// || Section 2: New User
		getPrevBtn.addEventListener('click', (ev) => {
			getNewUsrTabs[currentTab].classList.add('d-none');
			currentTab--;
			FORM.showFormFieldset(currentTab);
		});
		getNextBtn.addEventListener('click', (ev) => {
			// Validate data
			let currentInputs = getNewUsrTabs[currentTab].querySelectorAll('input');
			let isFieldValid;
			currentInputs.forEach((element) => {
				FORM.validateInputs(element);
				isFieldValid = element.checkValidity();
				if (!isFieldValid) {
					return;
				}
			});
			if (isFieldValid) {
				getNewUsrTabs[currentTab].classList.add('d-none');
				currentTab++;
				FORM.showFormFieldset(currentTab);
			}
		});
		// When the form gets submitted
		form.addEventListener('submit', (ev) => {
			// 1. Validate form details
			let isValid = FORM.validateForm(ev);
			// Form elements are valid
			if (isValid) {
				// 1. Create new user
				FORM.createNewUser(ev);
				// 2. Reset form
				form.reset();
				// 3. Hide Sign up Page
				const getSignUpPage = document.querySelector('#sec-newusr');
				getSignUpPage.classList.add('d-none');
				showNotif('User created', 'success');
			}
		});
	},
	navBarListeners() {
		const navBar = document.querySelector('.nav-bar');
		const navItems = document.querySelectorAll('.nav-items');

		// Upon scrolling
		let prevScrollpos = window.pageYOffset;
		window.onscroll = function () {
			let currentScrollpos = window.pageYOffset;
			// Scroll down
			if (prevScrollpos > currentScrollpos) {
				navBar.classList.add('active');
			} else {
				// Scroll up
				navBar.classList.remove('active');
			}
			prevScrollpos = currentScrollpos;
		};
		// Upon clicking of nav items
		navItems.forEach((clickedNav) => {
			clickedNav.addEventListener('click', () => {
				// 1. Reset navItems
				navItems.forEach((navItem) => navItem.classList.remove('active'));
				// 2. Display clicked tab
				clickedNav.classList.add('active');
				currentTab = [].indexOf.call(navItems, clickedNav);
				FORM.showTab(currentTab);
			});
		});
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
		const getMealSearch = document.querySelector('#meal-search-list');
		// When the form gets submitted
		form.addEventListener('submit', async (ev) => {
			ev.preventDefault();
			// 1. Get checked ingredients
			let getCheckedIngred = form.querySelectorAll('input:checked');
			/** @type {Array<string>} - ingredients as search query for the recipes */
			let ingredients = Array.prototype.map.call(getCheckedIngred, ({ value }) => value);
			// 3. Request in API the meals that can be cooked
			await searchMeals(ingredients);
			// 4. Extract mealSearch Ids
			let recipeSearchIds = activeUser.mealsSearchList.map(({ id }) => id);
			// console.log('recipeSearchIds', recipeSearchIds);
			// 5. Check which are not in the recipe cache
			let recipeCacheIds = extractIds(recipesInfo);
			recipeSearchIds = recipeSearchIds.filter((id) => !recipeCacheIds.includes(id));
			// console.log('recipeSearchIds', recipeSearchIds);
			// 6. Search recipe information (not in cache)
			if (recipeSearchIds.length !== 0) {
				await searchRecipeInfo(recipeSearchIds);
			}
			// 7. Reset previous meal result
			deleteChildNodes(getMealSearch);
			// 8. Display recipe information
			getMealSearch.parentElement.classList.remove('d-none');
			activeUser.mealsSearchList.forEach((mealResult) => {
				displaymealSearch(getMealSearch, mealResult, 'Save');
			});
			// 9. Scroll results into view
			getMealSearch.parentElement.scrollIntoView();
			window.scrollTo(0, window.pageYOffset - 190);
		});
	},
	mealPlanListeners() {
		const getMealSearch = document.querySelector('#meal-search-list');
		const getMealPlan = document.querySelector('#meal-plans');
		const getRecipeBackBtn = document.querySelector('#recipe .btn');

		// Onclick
		getMealSearch.addEventListener('click', (ev) => FORM.updateMealPlan(ev, getMealSearch, 'save'));
		getMealSearch.addEventListener('click', (ev) => FORM.viewRecipe(ev, getMealSearch));
		getMealPlan.addEventListener('click', (ev) => FORM.updateMealPlan(ev, getMealPlan, 'delete'));
		getMealPlan.addEventListener('click', (ev) => FORM.viewRecipe(ev, getMealPlan));
		getRecipeBackBtn.addEventListener('click', () => {
			// Show nav bar
			document.querySelector('nav').classList.remove('d-none');
			// Hide recipe tab
			let recipeTab = document.querySelector('#recipe');
			recipeTab.classList.add('d-none');
			// View previous tab
			document.querySelectorAll('.tab')[currentTab].classList.add('active');
		});
	},
	formatStrToLower(ev) {
		let field = ev.target;
		field.value = field.value.toLowerCase().trim();
	},
	formatStrToUpper(ev) {
		let field = ev.target;
		field.value = field.value.toUpperCase().trim();
	},
	showFormFieldset(n) {
		const getPrevBtn = document.querySelector('#prevBtn');
		const getNextBtn = document.querySelector('#nextBtn');
		const getNewUsrTabs = document.querySelectorAll('#newUserForm > fieldset');
		const getSignUpBtn = document.querySelector('#btn-signup');
		getNewUsrTabs[n].classList.remove('d-none');
		// Starting page
		if (n === 0) {
			getPrevBtn.style.visibility = 'hidden';
			getNextBtn.classList.remove('d-none');
		} else {
			// End page
			getPrevBtn.style.visibility = 'visible';
			getNextBtn.classList.add('d-none');
			getSignUpBtn.classList.remove('d-none');
		}
	},
	showTab(n) {
		let getTabs = document.querySelectorAll('.tab');
		// 1. Hide all tabs
		getTabs.forEach((tab) => tab.classList.remove('active'));
		// 2. Show clicked tab
		n === 1 && FORM.displayMealPlans();
		if (n === 2) {
			FORM.logout();
			showNotif('User logged out', 'success');
			return;
		}
		getTabs[n].classList.add('active');
	},
	displayMealPlans() {
		const getMealPlans = document.querySelector('#meal-plans');
		// 1. Reset meal plans
		deleteChildNodes(getMealPlans);
		// 2. Display meal plans
		activeUser.mealPlans.forEach((mealPlan) => displaymealSearch(getMealPlans, mealPlan, 'Delete'));
	},
	logout() {
		const navItems = document.querySelectorAll('.nav-items');
		// 1. Reset tab
		currentTab = 0;
		// 2. Reset navbar
		// 2.1 Hide navbar
		document.querySelector('.nav-bar').classList.remove('active');
		// 2.2 Set home page as active (default)
		navItems.forEach((navItem) => navItem.classList.remove('active'));
		document.querySelector('.nav-bar').firstElementChild.classList.add('active');
		// 3. Display login page
		document.querySelector('#sec-login').classList.remove('d-none');
	},
	testFridgeInput(ev) {
		let field = ev.target;
		fridgeItem = field.value;
		// Reset error
		field.setCustomValidity('');
		// Fridge Item already existing
		activeUser.fridgeList.includes(fridgeItem) && field.setCustomValidity('Fridge ingredient already exist. Please input another ingredient');
	},
	testLogin(ev) {
		let username = this.elements['username'];
		let password = this.elements['password'];
		// 1. Reset custom errors
		username.setCustomValidity('');
		password.setCustomValidity('');
		// 2. Check validity checks the element's value against the constraints (HTML rules)
		let isUsrValid = username.checkValidity();
		let isPwdValid = password.checkValidity();
		if (isUsrValid && isPwdValid) {
			try {
				// Find existing user in the user list
				let loginUsr = maintainUser(username.value, 'search');
				// User is not existing
				if (!loginUsr) throw 'Incorrect username or password';
				// Password is incorrect
				if (loginUsr.password !== password.value) throw 'Incorrect username or password';
				// User and password is correct
				// Store user information
				activeUser = maintainUser(username.value, 'search');
			} catch (err) {
				username.setCustomValidity(err);
				password.setCustomValidity(err);
			}
		}
	},
	testNewPassword(ev) {
		let field = ev.target;
		let password = document.forms['newUserForm'].elements['password'];
		// 1. Reset errors
		field.setCustomValidity('');
		password.setCustomValidity('');
		// 2. Check if re-entered password matches
		if (field.value !== password.value) {
			// Re-entered password does not match
			field.setCustomValidity('Password does not match');
			password.setCustomValidity('Password does not match');
		}
		// To immediately validate fields
		FORM.validateInputs(password);
		FORM.validateInputs(field);
	},
	testNewUser(ev) {
		let field = ev.target;
		let username = maintainUser(field.value, 'search');
		field.setCustomValidity('');
		// New Username is existing
		username && field.setCustomValidity('Username already exist. Please input other username.');
		// To immediately show the error
		FORM.validateInputs(field);
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
		// 1. [loginForm] Check if username and password are valid
		// Binds the function such that when running func testLogin, this refers to the loginForm
		form.id === 'loginForm' && FORM.testLogin.bind(form)();
		// 2. Validate input elements and show message
		inputElems.forEach((inputElem) => FORM.validateInputs(inputElem));
		return form.checkValidity();
	},
	updateMealPlan(ev, ulElem, action) {
		let btn = ev.target;
		if (btn.nodeName !== 'BUTTON') return;
		const getMealList = ulElem.children;
		const getMealCard = btn.parentElement.parentElement;
		// 1. Get index of data as basis to search meal plan
		let index = Array.prototype.indexOf.call(getMealList, getMealCard);
		// 2. Update meal plan
		activeUser.updateMealPlan(action, index);
		showNotif('Meal plan updated', 'success');
		// 3. For save function, disable button; for delete function, remove meal from HTML
		if (action === 'save') {
			// To prevent being clicked again
			btn.setAttribute('disabled', 'true');
		} else {
			// Delete from display
			getMealCard.remove();
		}
	},
	viewRecipe(ev, ulElem) {
		let btn = ev.target;
		if (btn.nodeName !== 'A') return;
		const getRecipe = document.querySelector('#recipe');
		const getMealList = ulElem.children;
		const getMealCard = btn.parentElement.parentElement;
		let mealList = ulElem.id === 'meal-search-list' ? activeUser.mealsSearchList : activeUser.mealPlans;
		// 1. Remove previous article content to reset
		let getArticleContent = document.querySelector('.article-content');
		getArticleContent && getArticleContent.remove();

		// 2. Get index of data as basis to search meal plan
		let index = Array.prototype.indexOf.call(getMealList, getMealCard);

		// 3. Display recipe content
		let recipe = displayRecipe(mealList[index]);
		getRecipe.appendChild(recipe);

		// 4. Show recipe content into view
		// Hide current tab
		document.querySelectorAll('.tab')[currentTab].classList.remove('active');
		// Hide navbar
		document.querySelector('nav').classList.add('d-none');
		document.querySelector('#recipe').classList.remove('d-none');
	},
	createNewUser(ev) {
		let form = ev.target;
		// 1. Store form values to object
		let formData = storeFormData(form);
		// 2. Create new user
		maintainUser(formData, 'create');
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
	updateMealPlan(action, index) {
		// Missing values passed
		if (action === undefined || index === undefined) return;
		if (action === 'delete') {
			this.mealPlans.splice(index, 1);
		} else {
			// Save action
			let savedMealPlan = this.mealsSearchList[index];
			// Check if meal plan was previously saved
			if (savedMealPlan.isSaved) return;
			// Add indication that meals have been saved
			this.mealsSearchList[index].isSaved = true;
			this.mealPlans.push(savedMealPlan);
		}
		// Update local storage
	}
	addFridgeList(item) {
		this.fridgeList.push(item);
	}
	/**
	 * This function stores the API result in the user object
	 * @param {Object} mealSearchResult - result from JSON
	 */
	addMealSearchList(mealSearchResult) {
		let mealPlanIds = activeUser.mealPlans.map(({ id }) => id);

		// 1. Check if meal searches which are existing in the meal plan
		let newMealSearchList = mealSearchResult.map((meal) => {
			let index = mealPlanIds.indexOf(meal.id);
			if (index !== -1) {
				// 2.1. Add property to indicate whether the meal plan was previously saved
				meal.isSaved = true;
				// Update meal plan
				this.mealPlans[index] = meal;
			}
			return meal;
		});
		// 1. Update meal search list
		this.mealsSearchList = newMealSearchList;
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
async function searchMeals(ingredients) {
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
async function searchRecipeInfo(recipes) {
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
		console.log(error);
	}
}
function createLI(content) {
	const newLI = document.createElement('li');
	newLI.textContent = content;
	return newLI;
}
function deleteChildNodes(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}
// Creates alert notifications
function showNotif(message, type) {
	const getNotif = document.querySelector('.alert');
	getNotif.innerHTML = message;
	if (type === 'success') {
		getNotif.className = 'alert alert-success';
	} else {
		getNotif.className = 'alert alert-warning';
	}
	getNotif.classList.add('active');

	setTimeout(() => {
		getNotif.className = 'alert';
	}, 3000);
}
function displayFridgeLI(ingredient, index = activeUser.fridgeList.length) {
	const getFridgeList = document.querySelector('#list-fridge');

	// 1. Create elements
	const newLI = document.createElement('li');
	newLI.className = 'input-grp custom-checkbox';

	const newInput = document.createElement('input');
	Object.assign(newInput, {
		type: 'checkbox',
		name: 'ingredient',
		id: `opt${index}`,
		value: ingredient,
	});

	const newLabel = document.createElement('label');
	newLabel.setAttribute('for', `opt${index}`);
	newLabel.textContent = ingredient;

	// 2. Append elements
	newLI.appendChild(newInput);
	newLI.appendChild(newLabel);
	getFridgeList.appendChild(newLI);
}
/**
 * Creates a UL and LI element for the recipe description (mins and servings)
 * to be displayed
 * @param {string | number} mins - number of minutes to cook the meal
 * @param {string | number} servings - servings of the meal
 * @returns {HTMLUListElement} UL element with the dot-separated recipe description
 */
function displayRecipeDesc(mins, servings) {
	let strMins = mins > 1 ? `${mins} mins` : `${mins} min`;
	let strServings = servings > 1 ? `${servings} servings` : `${servings} serving`;
	const newUL = document.createElement('ul');
	newUL.className = 'dot-separator';

	newUL.appendChild(createLI(strMins));
	newUL.appendChild(createLI(strServings));

	return newUL;
}
/**
 * Creates a UL and LI element for the dishtypes to be displayed
 * @param {Array<string>} dishTypes
 * @returns {HTMLUListElement} UL element with the dot-separated dish types
 */
function displayDishTypes(dishTypes) {
	const newUL = document.createElement('ul');
	newUL.className = 'dot-separator';

	dishTypes.forEach((dishtype) => {
		// Convert to dishtype to proper case
		let formatdishtype = dishtype[0].toUpperCase() + dishtype.substring(1);
		// Create HTML list element and append
		let newLI = createLI(formatdishtype);
		newUL.appendChild(newLI);
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

function displayIngredients(mealSearch) {
	// 1. Create HTML elements
	const newDiv = document.createElement('div');
	newDiv.className = 'article-ing';
	// Missing ingredients
	if (mealSearch.missedIngredientCount > 0) {
		const missedIngTitle = document.createElement('p');
		missedIngTitle.textContent = 'Missed Ingredients';

		const missedIng = document.createElement('ul');
		mealSearch.missedIngredients.forEach((ingredient) => {
			let newLI = createLI(ingredient.original);
			missedIng.appendChild(newLI);
		});

		newDiv.appendChild(missedIngTitle);
		newDiv.appendChild(missedIng);
	}
	// Used ingredients
	if (mealSearch.usedIngredientCount > 0) {
		const usedIngTitle = document.createElement('p');
		usedIngTitle.textContent = 'Used Ingredients';

		const usedIng = document.createElement('ul');
		mealSearch.usedIngredients.forEach((ingredient) => {
			let newLI = createLI(ingredient.original);
			usedIng.appendChild(newLI);
		});

		newDiv.appendChild(usedIngTitle);
		newDiv.appendChild(usedIng);
	}

	return newDiv;
}

function displayRecipeBtns(btnName) {
	const newDiv = document.createElement('div');
	newDiv.className = 'btn-grp d-flex f-row';

	const newBtn = document.createElement('button');
	newBtn.setAttribute('type', 'button');

	newBtn.className = 'btn mr-1';
	newBtn.textContent = btnName;

	const newLink = document.createElement('a');
	Object.assign(newLink, {
		href: '#recipe',
		className: 'btn',
		textContent: 'View',
	});
	newDiv.appendChild(newBtn);
	newDiv.appendChild(newLink);

	return newDiv;
}

/**
 * Function to display meal search in HTML
 * @param {HTMLElement} ulElem - ul element to display data.
 * @param {Object} mealSearch - mealSearch API results
 * @param {string} btnName - button name ('Save'/'Delete')
 * "Save" - For the meal search (to save in the meal plan)
 * "Delete" - For the meal plan list
 */
function displaymealSearch(ulElem, mealSearch, btnName) {
	let recipeID = mealSearch.id;
	let recipeInfo = recipesInfo.find((recipes) => recipes.id === recipeID);
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
	const newRecipeBtns = displayRecipeBtns(btnName);
	const btn = newRecipeBtns.querySelector('button');
	// Disable save btn if previously saved
	if (btnName === 'Save' && mealSearch.isSaved === true) {
		btn.setAttribute('disabled', 'true');
	}
	// 2. Append to recipe list
	newRecipeLI.appendChild(newRecipeImg);
	newRecipeLI.appendChild(newRecipeContentDiv);
	newRecipeLI.appendChild(newRecipeBtns);
	ulElem.appendChild(newRecipeLI);
}
function displayRecipe(meal) {
	let recipeID = meal.id;
	let recipeInfo = recipesInfo.find((recipes) => recipes.id === recipeID);
	// 1. Create elements
	const newArticleContent = document.createElement('div');
	newArticleContent.className = 'article-content';
	// Recipe Image
	const getArticleImg = document.querySelector('#recipe > header');
	getArticleImg.style.backgroundImage = `url(${recipeInfo.image})`;

	// Recipe Title
	const newRecipeTitle = document.createElement('h3');
	newRecipeTitle.textContent = recipeInfo.title;
	newArticleContent.appendChild(newRecipeTitle);

	// Recipe Description
	newArticleContent.appendChild(displayRecipeDesc(recipeInfo.readyInMinutes, recipeInfo.servings));
	newArticleContent.appendChild(displayDishTypes(recipeInfo.dishTypes));

	// Recipe Ingredients
	newArticleContent.appendChild(displayIngredients(meal));

	// Recipe Summary
	const newRecipeSumm = document.createElement('p');
	newRecipeSumm.className = 'text-italic pt-1 mb-1';
	newRecipeSumm.innerHTML = recipeInfo.summary;
	newArticleContent.appendChild(newRecipeSumm);

	// Recipe Button
	const newViewBtn = document.createElement('a');
	Object.assign(newViewBtn, {
		href: recipeInfo.sourceUrl,
		className: 'btn',
		target: '_blank',
		rel: 'noreferrer noopener',
		textContent: 'View Instructions',
	});
	newArticleContent.appendChild(newViewBtn);

	return newArticleContent;
}
function updateRecipeInfo(newRecipeInfo) {
	recipesInfo = [...recipesInfo, ...newRecipeInfo];
	// Store to local storage
	localStorage.setItem('recipesInfo', JSON.stringify(recipesInfo));
	return recipesInfo;
}
function extractIds(recipesList) {
	return recipesList.map(({ id }) => id);
}
// Test Data
if (localStorage[recipesInfo] !== undefined) {
	recipesInfo = JSON.parse(localStorage.recipesInfo);
}
// let testUser = JSON.parse(localStorage['mPlan.users'])[0];
const JSONtestUser = '{"username":"AGABRIEL","firstName":"ANNA","lastName":"GABRIEL","email":"y@g.com","password":"1234"}';
localStorage.setItem('mPlan.users', JSONtestUser);
maintainUser(JSON.parse(localStorage['mPlan.users']), 'create');
/* activeUser = maintainUser('AGABRIEL');
activeUser.fridgeList.push(...testUser.fridgeList);
activeUser.mealsSearchList.push(...testUser.mealsSearchList);
activeUser.mealPlans.push(...testUser.mealPlans);
activeUser.fridgeList.forEach((item, index) => displayFridgeLI(item, index));
const getMealSearch = document.querySelector('#meal-search-list');
activeUser.mealsSearchList.forEach((mealResult) => {
	displaymealSearch(getMealSearch, mealResult, 'Save');
});
 */
