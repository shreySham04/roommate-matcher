# roommate-matcher
The Roommate Selector is a data-driven application designed to help individuals find the most compatible roommates based on their preferences and lifestyles. By analyzing survey responses from potential roommates, the system computes compatibility scores using various factors such as location, rent budget, daily routines, habits, hobbies, and personal preferences. It provides personalized recommendations, helping users make informed decisions and avoid conflicts commonly associated with shared living arrangements.

Key Features:

1. Personalized Matching: Users input their serial number to find the best roommate matches from the dataset.

2. Compatibility Scoring: Matches are ranked based on shared habits, interests, and preferences, ensuring greater harmony in living conditions.

3. Detailed Match Reports: Each recommended match includes reasons explaining the compatibility, helping users understand why a roommate would be a good fit.

4. Real-world Factors: The system considers practical aspects like rent affordability, smoking/drinking habits, sleeping schedules, cleanliness, and openness to pets.

5. User-friendly Interface: Simple input-based interaction makes it easy to find the best matches without needing technical expertise.
# Roomer

Roomer is a privacy-conscious roommate recommendation demo. It ranks eligible synthetic profiles using explainable preference similarity for location, rent, routines, habits, cleanliness, pets, and interests.

## Current implementation

- React guest-mode interface with local CSV upload.
- Browser-local CSV parsing with a 2 MB file limit and required-column validation.
- One authoritative implementation in `matching.js` for normalization, hard eligibility, weighted scoring, explanations, and deterministic ties.
- Synthetic `roomy.csv`; recommendation cards never display names, emails, phone numbers, or free-text survey responses.
- Node test suite covering rent parsing, normalization, ranking, duplicate/self exclusion, gender constraints, ties, and empty input.

The score is a rule-based compatibility summary, not a probability of successful cohabitation and not a validated prediction of user satisfaction.

## Architecture

```text
CSV file -> csv.js -> matching.js -> React dashboard
						 |
						 +-> normalized similarities
						 +-> explicit eligibility constraints
						 +-> weighted score and explanations
```

The browser is currently the only runtime. The old notebook is retained as historical project material, but it is not used by the application and still contains the original duplicated algorithm and historical outputs. It should not be run or published until it is rewritten against synthetic data.

## Scoring

For each available preference, the matcher computes a similarity from 0 to 1 and combines it with the configured weight:

```text
score = 100 * sum(weight * similarity) / sum(weight for available preferences)
```

Missing values are omitted from the denominator rather than treated as agreement. Invalid gender requirements exclude a candidate before ranking when the selected profile explicitly asks for a particular gender. The matcher excludes the selected row and uses source-row order as a deterministic tie breaker.

## Local setup

Prerequisites: Node.js 18 or newer.

```bash
npm install
npm start
```

Run the core tests:

```bash
npm test
```

The project currently has no backend, accounts, database, or external API. The guest entry screen is deliberately not authentication. Do not upload real survey data: use synthetic or properly anonymized records only.

## Privacy and limitations

The replacement CSV contains synthetic records. The previous CSV and notebook included personal and sensitive survey fields; deleting them from the current working tree does not erase earlier Git commits. Historical cleanup requires an authorized repository-history rewrite, coordination with any remotes and collaborators, and verification with repository scans. No such history purge is claimed here.

The current application does not yet provide a backend, persistent accounts, notebook-based EDA, recommendation benchmarks, or frontend component tests. Demographic fields are not scored; the explicit roommate-gender preference remains an eligibility rule because it is selected as a housing requirement in the source schema. Future work should add a rewritten synthetic-data analysis notebook, broader CSV tests, and a security-reviewed backend only if accounts or persistence become necessary.
