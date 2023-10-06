import csv
import json

# Specify the input CSV file and output JSON file names
csv_file = 'mapping.csv'
json_file = 'Resources/map.json'

# Read the CSV file and convert to JSON
csv_data = []
with open(csv_file, 'r', newline='') as csvfile:
    csv_reader = csv.DictReader(csvfile)
    for row in csv_reader:
        csv_data.append(row)

# Write JSON data to a JSON file
with open(json_file, 'w') as jsonfile:
    json.dump(csv_data, jsonfile, indent=4)

print(f'CSV to JSON conversion complete. JSON data has been exported to {json_file}')
