import React, { useState, useEffect, Suspense } from "react";
import "./App.css";
import { database, ref, set, push, onValue, remove, auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import dishImage from "./images/dish-dinner.svg";
import bananImage from "./images/banana.svg";
import carrotImg from "./images/carrot.svg";
import saladImage from "./images/salad.svg";
const RecipeModal = React.lazy(() => import("./RecipeModal"));

const App = () => {
  const [groceriesList, setGroceriesList] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [requestText, setRequestText] = useState("");
  const [recipe, setRecipe] = useState(""); // For the generate tab
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedGroceries, setGeneratedGroceries] = useState([]); // For the generate tab
  const [activeTab, setActiveTab] = useState("manual");
  const [recipesList, setRecipesList] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null); // Separate state for saved recipe details

  const [user, setUser] = useState(null); // Track authenticated user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true); // To handle loading state during auth check

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false); // Authentication check is done
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const groceriesRef = ref(database, `users/${user.uid}/groceriesList`);
      const recipesRef = ref(database, `users/${user.uid}/recipesList`);

      onValue(groceriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setGroceriesList(data);
        }
      });

      onValue(recipesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRecipesList(Object.values(data));
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedRecipe && user) {
      const recipeRef = ref(
        database,
        `users/${user.uid}/recipesDetails/${selectedRecipe.id}`
      );
      onValue(recipeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRecipeDetails({
            recipe: data.recipe,
            ingredients: data.ingredients || [],
          });
        }
      });
    }
  }, [selectedRecipe, user]);

  const handleSignUp = () => {
    setAuthLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setAuthLoading(false);
      })
      .catch((error) => {
        console.error("Error signing up:", error);
        setAuthLoading(false);
      });
  };

  const handleSignIn = () => {
    setAuthLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setAuthLoading(false);
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setAuthLoading(false);
      });
  };

  const handleSignOut = () => {
    setAuthLoading(true);
    signOut(auth)
      .then(() => {
        setUser(null);
        setAuthLoading(false);
      })
      .catch((error) => {
        console.error("Error signing out:", error);
        setAuthLoading(false);
      });
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const data = await processMessageToChatGPT(requestText);
      const content = data.choices[0].message.content;
      const parsedContent = JSON.parse(content);

      if (parsedContent) {
        setRecipe(parsedContent.recipe || "");
        setGeneratedGroceries(parsedContent.groceries || []);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setLoading(false);
    }
  };

  async function processMessageToChatGPT(request) {
    try {
      const response = await fetch(
        "https://us-central1-new-home-bfbe7.cloudfunctions.net/getRecipe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestText: request }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure the data has the expected structure
      if (!data.choices || !data.choices.length) {
        throw new Error("No data found");
      }

      return data;
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  const handleCheck = (index) => {
    const updatedList = groceriesList.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setGroceriesList(updatedList);
    set(ref(database, `users/${user.uid}/groceriesList`), updatedList);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      const newItemObj = { name: newItem, checked: false };
      const updatedList = [...groceriesList, newItemObj];
      setGroceriesList(updatedList);
      setNewItem("");
      set(ref(database, `users/${user.uid}/groceriesList`), updatedList);
    }
  };

  const handleDeleteItem = (index) => {
    const updatedList = groceriesList.filter((_, i) => i !== index);
    setGroceriesList(updatedList);
    set(ref(database, `users/${user.uid}/groceriesList`), updatedList);
  };

  const handleAddRecipeToGroceries = () => {
    const newItems = generatedGroceries.map((item) => ({
      name: item,
      checked: false,
    }));
    const updatedList = [...groceriesList, ...newItems];
    setGroceriesList(updatedList);
    setShowModal(false);
    setGeneratedGroceries([]);
    set(ref(database, `users/${user.uid}/groceriesList`), updatedList);
  };

  const handleClearList = () => {
    setGroceriesList([]);
    set(ref(database, `users/${user.uid}/groceriesList`), []);
  };

  const handleSaveRecipe = (recipeName, recipeDetails) => {
    const newRecipeRef = push(ref(database, `users/${user.uid}/recipesList`));
    const newRecipeId = newRecipeRef.key;

    set(newRecipeRef, {
      id: newRecipeId,
      name: recipeName,
    });

    set(
      ref(database, `users/${user.uid}/recipesDetails/${newRecipeId}`),
      recipeDetails
    );
    setGeneratedGroceries([]);
    setRecipe("");
  };

  const handleRecipeClick = (recipe) => {
    if (showRecipeDetails && showRecipeDetails.id === recipe.id) {
      setShowRecipeDetails(null); // Hide recipe details if it's already shown
    } else {
      setShowRecipeDetails(recipe); // Show recipe details
      setSelectedRecipe(recipe); // Ensure that selectedRecipe is updated to fetch details
    }
  };

  const handleDeleteRecipe = (id) => {
    // Remove the recipe from the database
    remove(ref(database, `users/${user.uid}/recipesList/${id}`));
    remove(ref(database, `users/${user.uid}/recipesDetails/${id}`));

    // Update the local state
    setRecipesList(recipesList.filter((recipe) => recipe.id !== id));
    if (showRecipeDetails && showRecipeDetails.id === id) {
      setShowRecipeDetails(null);
    }
  };

  const handleLoadGroceriesFromRecipe = () => {
    if (recipeDetails) {
      const newItems = recipeDetails.ingredients.map((item) => ({
        name: item,
        checked: false,
      }));
      const updatedList = [...groceriesList, ...newItems];
      setGroceriesList(updatedList);
      set(ref(database, `users/${user.uid}/groceriesList`), updatedList);
    }
  };

  return (
    <div className="App">
      {authLoading ? (
        <div class="grocery-container">
          <div class="grocery-item-loading item1">
            <img src={carrotImg} alt="carrot" />
          </div>
          <div class="grocery-item-loading item2">
            <img src={saladImage} alt="salad" />
          </div>
          <div class="grocery-item-loading item3">
            <img src={bananImage} alt="banana" />
          </div>
          <div class="cart"></div>
        </div>
      ) : user ? (
        <div>
          <button className="signout-button" onClick={handleSignOut}>
            Sign Out
          </button>

          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "manual" ? "active" : ""}`}
              onClick={() => setActiveTab("manual")}
            >
              Manual
            </button>
            <button
              className={`tab-button ${
                activeTab === "generate" ? "active" : ""
              }`}
              onClick={() => setActiveTab("generate")}
            >
              Generate
            </button>
            <button
              className={`tab-button ${
                activeTab === "recipes" ? "active" : ""
              }`}
              onClick={() => setActiveTab("recipes")}
            >
              Recipes
            </button>
          </div>

          {activeTab === "manual" && (
            <div className="manual-tab">
              <h1>Grocery List</h1>

              <div className="manual-adding-form">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add new item"
                  className="input-field"
                />
                <div className="manual-adding-buttons">
                  <button
                    disabled={!newItem}
                    className="add-item-button"
                    onClick={handleAddItem}
                  >
                    Add Item
                  </button>
                  <button
                    disabled={!groceriesList.length}
                    className="clear-list-button"
                    onClick={handleClearList}
                  >
                    Clear List
                  </button>
                </div>
              </div>
              {!groceriesList.length ? (
                <p className="emty-list-message">
                  There is nothing in the list at the moment...
                </p>
              ) : (
                <ul className="grocery-list">
                  {groceriesList.map((item, index) => (
                    <li
                      key={index}
                      className={`grocery-item ${
                        item.checked ? "checked" : ""
                      }`}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleCheck(index)}
                        />
                        {item.name}
                      </label>
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="delete-item-button"
                      >
                        &#10005;
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "generate" && (
            <div className="generate-tab">
              <h1>Generate Grocery List & Recipe</h1>
              <div className="form-container">
                <input
                  type="text"
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="Type a recipe request..."
                  className="input-field"
                />
                <button
                  onClick={handleSendRequest}
                  className="submit-button"
                  disabled={loading || !requestText}
                >
                  {loading ? <div className="loader"></div> : "Generate recipe"}
                </button>
              </div>
              {loading && (
                <div className="loading-image">
                  <img src={dishImage} alt="dish" />
                </div>
              )}
              <Suspense fallback={<div>Loading...</div>}>
                {showModal && (
                  <RecipeModal
                    recipe={recipe}
                    handleAddRecipeToGroceries={handleAddRecipeToGroceries}
                    generatedGroceries={generatedGroceries}
                    handleSaveRecipe={handleSaveRecipe}
                    setShowModal={setShowModal}
                  />
                )}
              </Suspense>
            </div>
          )}

          {activeTab === "recipes" && (
            <div className="recipes-tab">
              <h1>Saved Recipes</h1>
              <ul className="recipes-list">
                {recipesList.map((recipe) => (
                  <li
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe)}
                    className="recipe-item"
                  >
                    <span
                      className={`recipe-link ${
                        showRecipeDetails && showRecipeDetails.id === recipe.id
                          ? "active"
                          : ""
                      }`}
                    >
                      {recipe.name}
                    </span>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="delete-item-button"
                    >
                      &#10005;
                    </button>
                  </li>
                ))}
              </ul>
              {showRecipeDetails && (
                <div className="recipe-details">
                  <h2>Recipe Details</h2>
                  <p>{recipeDetails?.recipe}</p>
                  <h3>Ingredients</h3>
                  <ul className="generated-groccery-list">
                    {recipeDetails?.ingredients.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <button
                    className="add-item-button"
                    onClick={handleLoadGroceriesFromRecipe}
                  >
                    Load Groceries
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="auth-container">
          <h1>Welcome to the Grocery & Recipe App</h1>
          <div className="inputs">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field"
            />
          </div>

          <div className="auth-buttons">
            <button onClick={handleSignUp}>Sign Up</button>
            <button onClick={handleSignIn}>Sign In</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
