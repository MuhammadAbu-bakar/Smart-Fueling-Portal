const SPREADSHEET_ID = '1qKwgQvTBj7LCg13wr8t3xAX5Cf2GR6kzmez1x7YMiJo';
const API_KEY = 'AIzaSyD-4FBfLUqvRAiE1BAVpPdzC2W0Bvd5azw';

export const fetchGoogleSheetData = async (sheetName, range) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.values; // Returns the values from the specified sheet and range
  } catch (error) {
    console.error(`Error fetching data from Google Sheets (Sheet: ${sheetName}, Range: ${range}):`, error);
    return null;
  }
};