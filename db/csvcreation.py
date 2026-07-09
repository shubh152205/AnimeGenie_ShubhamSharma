import csv

header = ['Name', 'Age', 'City']
data = [
    ['Alice', 30, 'New York'],
    ['Bob', 25, 'Los Angeles'],
    ['Charlie', 35, 'Chicago'],
    ['Diana', 28, 'Miami'],
    ['Ethan', 42, 'Seattle'],
    ['Fiona', 31, 'Austin'],
    ['George', 29, 'Boston'],
    ['Hannah', 27, 'Denver']
]

with open('people.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(header)
    writer.writerows(data)

print("CSV file created successfully.")