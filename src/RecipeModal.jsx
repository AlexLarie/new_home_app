import React from "react";

export default function RecipeModal({recipe,handleAddRecipeToGroceries,  generatedGroceries,handleSaveRecipe,setShowModal}) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Generated Recipe</h2>
        <p>{recipe}</p>
        <h2>Generated Groceries</h2>
        <ul className="generated-groccery-list">
          {generatedGroceries.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <div className="generated-buttons">
          <button onClick={handleAddRecipeToGroceries}>Add to Groceries</button>
          <button
            onClick={() => {
              const recipeName = prompt("Enter recipe name:");
              if (recipeName) {
                handleSaveRecipe(recipeName, {
                  recipe,
                  ingredients: generatedGroceries,
                });
              }
              setShowModal(false);
            }}
          >
            Save Recipe
          </button>
          <button className="close-modal" onClick={() => setShowModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
