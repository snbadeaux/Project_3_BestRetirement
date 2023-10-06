--Create Table Schema
CREATE TABLE Zipcode_Table(
	index INT NOT NULL,
	provider_state VARCHAR(2) NOT NULL,
		FOREIGN KEY (provider_state) REFERENCES Healthcare_Tax_Merged_Table(provider_state)
	provider_zip_code INT PRIMARY KEY NOT NULL
);

CREATE TABLE Performance_Table(
	index INT NOT NULL,
	most_recent_health_inspection_more_than_2_years_ago VARCHAR(5) NOT NULL,
	overall_rating INT NOT NULL,
	health_inspection_rating INT NOT NULL,
	staffing_rating INT NOT NULL,
	RN_staffing_rating INT NOT NULL,
	total_weighted_health_survey_score NUMERIC(6,6) NOT NULL,
	number_of_facility_reported_incidents INT NOT NULL,
	number_of_substantial_complaints INT NOT NULL,
	number_of_fines INT NOT NULL,
	total_amount_of_fines_in_dollars NUMERIC(10,2) NOT NULL,
	number_of_payment_denials INT NOT NULL,
	total_number_of_penalties INT NOT NULL,
	performance_id INT NOT NULL PRIMARY KEY
);




CREATE TABLE Business_Table (
	index INT NOT NULL,
	federal_provider_number INT PRIMARY KEY NOT NULL, 
	provider_name VARCHAR(225) NOT NULL,
	provider_city VARCHAR(30) NOT NULL,
	provider_zip_code INT NOT NULL,
		FOREIGN KEY (provider_zip_code) REFERENCES Zipcode_Table(provider_zip_code),
	provider_county_name VARCHAR(30) NOT NULL,
	ownership_type VARCHAR(30) NOT NULL,
	number_of_certified_beds INT NOT NULL,
	number_of_residents_in_certified_beds INT NOT NULL,
	provider_type VARCHAR(30) NOT NULL,
	provider_resides_in_hopsital VARCHAR(5) NOT NULL,
	automatic_sprinkler_systems_in_all_required_areas VARCHAR(3) NOT NULL,
	location VARCHAR(225) NOT NULL,
	processing_data DATE NOT NULL,
	latitude NUMERIC(6,6) NOT NULL,
	longitude NUMERIC(6,6) NOT NULL,
	adjusted_total_nurse_staffing_hours_per_resident_per_day NUMERIC(6,6) NOT NULL,
	performance_id INT NOT NULL,
		FOREIGN KEY (performance_id) REFERENCES Performance_Table(performance_id)
);

CREATE TABLE Healthcare_Tax_Merged_Table (
	healthcare_rank INT NOT NULL,
	provider_state VARCHAR(15) PRIMARY KEY NOT NULL,
	healthcare_score NUMERIC(2,2) NOT NULL,
	healthcare_cost NUMERIC(2,2) NOT NULL,
	healthcare_quality NUMERIC(2,2) NOT NULL,
	healthcare_access NUMERIC(2,2) NOT NULL,
	tax_rank INT NOT NULL,
	median_effective_property_tax_rate NUMERIC (10,10) NOT NULL,
	mean_effective_property_tax_rate NUMERIC (10,10) NOT NULL,
	median_home_value INT NOT NULL,
	median_property_taxes_paid INT NOT NULL,
	aggergate_home_value INT NOT NULL,
	aggregate_property_taxes_paid INT NOT NULL
);