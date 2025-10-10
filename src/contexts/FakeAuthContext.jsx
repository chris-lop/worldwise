import { createContext, useContext, useReducer, useEffect } from "react";

const AuthContext = createContext();
const USER_STORAGE_KEY = "worldwise-user";

// Helper functions for localStorage operations
function getUserFromStorage() {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function saveUserToStorage(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function removeUserFromStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

const initialState = { user: null, isAuthenticated: false };

function reducer(state, action) {
  switch (action.type) {
    case "login":
      return { ...state, user: action.payload, isAuthenticated: true };
    case "logout":
      return { ...state, user: null, isAuthenticated: false };
    default:
      throw new Error("Unknown Action");
  }
}

const FAKE_USER = {
  name: "Jack",
  email: "jack@example.com",
  password: "qwerty102r857!@",
  avatar: "https://i.pravatar.cc/100?u=zz",
};

function AuthProvider({ children }) {
  const [{ user, isAuthenticated }, dispatch] = useReducer(
    reducer,
    initialState
  );

  // Load user from localStorage on initialization
  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (storedUser) {
      dispatch({ type: "login", payload: storedUser });
    }
  }, []);

  function login(email, password) {
    if (email === FAKE_USER.email && password === FAKE_USER.password) {
      saveUserToStorage(FAKE_USER);
      dispatch({ type: "login", payload: FAKE_USER });
    }
  }
  function logout() {
    removeUserFromStorage();
    dispatch({ type: "logout" });
  }
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("AuthContext was used outside the AuthProvider");
  return context;
}

export { AuthProvider, useAuth };
