# AI Company Research Tool

A tool that uses AI to automatically research and populate company information, converting CSV files containing only company names into detailed reports with rich business intelligence.

## Features

- Upload CSV files for batch company research
- Customize research fields
- Access perplexity/sonar-pro and other AI models via OpenRouter API
- Real-time processing progress
- Export enriched CSV files with research results

## Tech Stack

- **Frontend**: React + AntDesign UI
- **Backend**: Node.js + Express
- **AI Integration**: OpenRouter API (perplexity/sonar-pro model)
- **Data Processing**: PapaParse (CSV parsing)

## Quick Start

### Prerequisites

- Node.js (v14+)
- OpenRouter API key (https://openrouter.ai)

### Installation Steps

1. Clone repository

```bash
git clone https://github.com/yourusername/company-research-tool.git
cd company-research-tool
```

2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run client-install
```

3. Configure environment variables

Create `.env` file in root directory and add:

```
PORT=5001
```

Create `/client/.env` and add:
```
PORT = 3000
REACT_APP_OPENROUTER_API_KEY = {YOUR_OPENROUTER_API_KEY}
```

4. Start development server

```bash
# Run frontend and backend together
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client
```

The application will run at [http://localhost:3000](http://localhost:3000), with the API server at [http://localhost:5001](http://localhost:5001).

## Usage

1. **Prepare CSV file**: CSV file must contain at least one column with company names
2. **Upload file**: Upload CSV file in the application
3. **Select research fields**: Choose company data points to research from available fields
4. **Enter API key**: Provide your OpenRouter API key
5. **Start research**: Click "Start Research" button to begin processing
6. **View results**: Review research results after processing completes
7. **Download results**: Download CSV file containing all research data

## Research Fields Description

The tool supports research fields including but not limited to:

- **Company Basic Information**: Year established, industry, business coverage (B2B/B2C), etc.
- **Financial Information**: Company revenue, financial status, PE backing, etc.
- **Market Information**: Competition landscape, market share, ranking, etc.
- **Tech Stack**: E-commerce platform, customer service ticketing system, etc.
- **Customer Service**: Number of customer service agents, customer service challenges, etc.

## Deployment

### Production Build

```bash
# Generate production build
npm run build
```

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create application
heroku create your-app-name

# Push to Heroku
git push heroku main
```

## Customization & Extension

### Adding New Research Fields

1. Add new fields to the `researchFields` array in `App.jsx`
2. Include new fields in the AI prompt template in `server.js`

### Change AI Model

In `server.js`, modify the `model` parameter in OpenRouter API request:

```javascript
// Use different AI model
const response = await axios.post(openRouterUrl, {
  model: 'anthropic/claude-3-haiku-20240307', // Change to desired model
  // ...other parameters
});
```

## License

MIT