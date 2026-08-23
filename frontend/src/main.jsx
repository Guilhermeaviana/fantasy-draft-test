import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { bootstrapGuestSession } from './api/client';
import './index.css';

async function startApplication() {
    try {
        await bootstrapGuestSession();

        ReactDOM.createRoot(
            document.getElementById('root'),
        ).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
        );
    } catch (error) {
        console.error('Failed to initialize guest session.', error);

        document.getElementById('root').innerHTML = `
            <div class="startup-error">
                <h1>Não foi possível iniciar a aplicação.</h1>
                <p>Verifique se a API Laravel está disponível.</p>
            </div>
        `;
    }
}

startApplication();