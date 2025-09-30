// Code Style Documentation

// This document outlines the structure and organization of the javascript codebase for the Green Maple Leaf App. 
// Created by Green Maple Leaf Technologies.

// Project Root Directory: "src/"



// ================================================================================================================

// Variables
// Use camelCase for dynamic variable names.
let exampleVariableName = "value";

// Use UPPER_SNAKE_CASE for constant variables.
const EXAMPLE_CONSTANT = 42;

// Variable Declaration: var vs. let vs. const
// Use 'const' for variables that will not be reassigned and are constant.
// use 'let' for everything else.
// Do not use 'var' (unless you must for a very specific use case).



// Private Variables
// Use a leading underscore (_) for private variables which will be implemented via extension (Extended classes).
// Use a # for private variables which will not be implemented via extension (Completely private).
class ExampleClass {
    #completelyPrivateVariable; // Completely private variable
    constructor() {
        this._privateVariable = "I am private";
        this.#completelyPrivateVariable = "I am completely private";
    }
}



// Functions
// Use camelCase for function names.
// Must indicate parameters, return types, and brief outline of function in comments / description.
// (Parameter type is optional, return type is mandatory (unless void)).

/**
 * Brief description of what the function does.
 * @param {*} param1 - description of param1
 * @param {*} param2 - description of param2
 * @return {*} description of the return value
 */
function exampleFunctionName(param1, param2) {
    // Function body
}

// You DO NOT need to add a description, parameters, and return indication for functions that are:
// - Event listeners
// - Getters / Setters
// - Delegate functions




// Classes
// Use PascalCase for class names.
// Add a brief description of the class in comments / description.
// Must indicate constructor parameters and brief outline of class in comments / description.
// (Again parameter types are optional.)

/**
 * Brief description of what the class does.
 */
class ExampleClassName {
    /**
     * Constructor for ExampleClassName.
     * @param {*} param1 - description of param1
     * @param {*} param2 - description of param2
     */
    constructor(param1, param2) {
        // Constructor body
    }

    // Class methods
    /**
     * Brief description of what the method does.
     * (This specific function returns nothing, so i do not have to put a return type.)
     */
    methodName() {
        // Method body
    }
}




// Equality Checks
// Use strict equality (===) and strict inequality (!==) operators for comparisons.
// Avoid using loose equality (==) and loose inequality (!=) operators to prevent unexpected type coercion.
let correctComparison = (exampleVariableName === "value");
let incorrectComparison = (exampleVariableName == "value"); // AVOID THIS




// Comments
// Place comments before code blocks they refer to OR on their own line on the code.
// Do not have prolonged logic without comments explaining what is happening.
// (Especially important for complex algorithms, logic, or calculations.)

// For rather complex calculations, logic, or algorithms, break them down into smaller parts.
// Add comments explaining what each part does.
// For calculations, include formulas if possible above each step.

// When placing comments in a statement such as a loop or conditional, description of conditional.
// should be placed above the statement.

// Checking if 1 + 1 equals 2.
if (1 + 1 === 2)
{
    // 1 + 1 does equal 2, now we will celebrate.
}
else
{
    // 1 + 1 does not equal 2, which means the universe is lying to us.
}


// Looping from 0 to 9 (10 iterations).
for (let i = 0; i < 10; i++)
{
    console.log(i); // Print the current iteration number.
}




// ================================================================================================================

// Project Structure
// This project is file structure is detailed in the structure.txt file in the documentation folder.
// Below is a brief overview of the important parts of the file structure.

// "Assets" folders contain images, icons, audio, and other static resources.
// "CSS" folders contain stylesheets for the corresponding HTML files.
// "JS" folders contain javascript files for the corresponding HTML files.
// "Shared" folders contain resources that are shared across multiple parts of the application.
// "Index.html" is the main entry point of the application.



// ================================================================================================================

// Code Structure Overview:
// All primary sections of the application have their own folder within the "src" directory.

// Each section must have a superior manager CLASS OBJECT that handles the overall functionality of that section,
// This is a singular class object that is unique to that section.
// and is instantiated in the corresponding HTML file.
// This manager is the entry point for that section.
// This manager must:
// - Handle initialization of the section.
// - Hold all delegate functions for event listeners in that section.
// - Handle all interactivity in that section.
// - Handle all communication with other sections of the application (if applicable).
// - Handle all communication with the backend server (if applicable).

// Then each section will have "sub modules" that will handle specific functionality within that section.
// A sub modules can have multiple internal classes.
// EX: the map editor will have a sub modules that handle the map display, map regions and editing, map UI, and etc.

// Note: All code must be centralized within the section it belongs to.
// Note: All classes within in a sub module must be instantiated and managed by the section manager.

// NO FREESTANDING FUNCTIONS, all functions must be part of a class.



// ================================================================================================================



// Refactoring with AI.
// When refactoring code with AI, ensure that the refactored code adheres to the established code style.
// (Always keep refering back to this document literally anytime you want AI to do something!!!!!)
// (Always keep refering back to this document literally anytime you want AI to do something!!!!!)
// (Always keep refering back to this document literally anytime you want AI to do something!!!!!)
// (Always keep refering back to this document literally anytime you want AI to do something!!!!!)

