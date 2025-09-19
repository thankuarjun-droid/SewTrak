# SewTrak Backend

This directory contains the Node.js Express server for the SewTrak application.

## Overview

This server provides a RESTful API for the frontend application to interact with. It manages all the data in-memory, replacing the mock data service that was previously part of the frontend.

## Running Locally

1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `npm install`
3.  Start the server: `npm start`

The server will start on port 8080 by default.

## Deployment

This backend is configured for automatic deployment to Google Cloud Run via Google Cloud Build. The configuration is defined in `cloudbuild.yaml` at the root of the project.