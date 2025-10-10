import {
  useEffect,
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import citiesData from "../../data/cities.json";

const CITIES_STORAGE_KEY = "worldwise-cities";
const CitiesContext = createContext();

// Helper functions for localStorage operations
function getCitiesFromStorage() {
  const stored = localStorage.getItem(CITIES_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return default cities data if nothing in localStorage
  return citiesData.cities;
}

function saveCitiesToStorage(cities) {
  localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
}

function generateCityId() {
  return crypto.randomUUID();
}

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };
    case "cities/loaded":
      return { ...state, isLoading: false, cities: action.payload };
    case "city/loaded":
      return { ...state, isLoading: false, currentCity: action.payload };
    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };
    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };
    case "rejected":
      return { ...state, isLoading: false, error: action.payload };
    default:
      throw new Error("Unknown action type");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(function () {
    function loadCities() {
      dispatch({ type: "loading" });
      try {
        const citiesData = getCitiesFromStorage();
        dispatch({ type: "cities/loaded", payload: citiesData });
      } catch {
        dispatch({
          type: "rejected",
          payload: "There was an error loading cities...",
        });
      }
    }
    loadCities();
  }, []);

  const getCity = useCallback(
    function getCity(cityId) {
      if (Number(cityId) === currentCity.id) return;
      dispatch({ type: "loading" });
      try {
        const citiesData = getCitiesFromStorage();
        const city = citiesData.find((city) => city.id === cityId);
        if (city) {
          dispatch({ type: "city/loaded", payload: city });
        } else {
          dispatch({
            type: "rejected",
            payload: "City not found...",
          });
        }
      } catch {
        dispatch({
          type: "rejected",
          payload: "There was an error loading the city...",
        });
      }
    },
    [currentCity.id]
  );

  function createCity(newCity) {
    dispatch({ type: "loading" });
    try {
      const citiesData = getCitiesFromStorage();
      const cityWithId = {
        ...newCity,
        id: generateCityId(),
      };
      const updatedCities = [...citiesData, cityWithId];
      saveCitiesToStorage(updatedCities);
      dispatch({ type: "city/created", payload: cityWithId });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was an error creating the city...",
      });
    }
  }

  function deleteCity(id) {
    dispatch({ type: "loading" });
    try {
      const citiesData = getCitiesFromStorage();
      const updatedCities = citiesData.filter((city) => city.id !== id);
      saveCitiesToStorage(updatedCities);
      dispatch({ type: "city/deleted", payload: id });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was an error deleting city...",
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        error,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error("CitiesContext being used outside of CitiesProvider");
  return context;
}

export { CitiesProvider, useCities };
