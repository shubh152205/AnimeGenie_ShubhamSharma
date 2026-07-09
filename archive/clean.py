import pandas as pd
import os

# Get directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'Chocolate Sales (2).csv')

# 1. Load the dataset
df = pd.read_csv(csv_path)
print("--- Original Data Types ---")
print(df.dtypes)

# 2. Clean the 'Amount' column
# Remove '$' and ',' then convert to a float (decimal number)
df['Amount'] = df['Amount'].str.replace('$', '', regex=False)
df['Amount'] = df['Amount'].str.replace(',', '', regex=False)
df['Amount'] = df['Amount'].astype(float)

# 3. Clean the 'Date' column
# Convert the text dates into actual datetime objects
df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y')

# 4. Standardize text data (Optional but good practice)
# Ensure product names don't have accidental leading/trailing spaces
df['Product'] = df['Product'].str.strip()
df['Sales Person'] = df['Sales Person'].str.strip()

# 5. Check for and remove any duplicate rows
df = df.drop_duplicates()

print("\n--- Cleaned Data Types ---")
print(df.dtypes)

# 6. Save the cleaned data to a new CSV file
df.to_csv(os.path.join(script_dir, 'Cleaned_Chocolate_Sales.csv'), index=False)
print(f"\nCleaned file saved successfully as '{os.path.join(script_dir, 'Cleaned_Chocolate_Sales.csv')}'")