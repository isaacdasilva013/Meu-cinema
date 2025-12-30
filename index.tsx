import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly initialize state as a class property to satisfy TypeScript
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 20, color: 'white', backgroundColor: '#0F172A', height: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <h1 style={{fontSize: '24px', marginBottom: '10px'}}>Algo deu errado.</h1>
          <p style={{color: '#94a3b8', marginBottom: '20px'}}>O aplicativo encontrou um erro crítico.</p>
          <pre style={{backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 8, overflow: 'auto', maxWidth: '80%', color: '#f87171', fontSize: '12px'}}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{marginTop: 30, padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 99, cursor: 'pointer', fontWeight: 'bold'}}
          >
            TENTAR NOVAMENTE
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e) {
  console.error("Fatal Error during render:", e);
  rootElement.innerHTML = '<div style="color:white;padding:20px">Fatal Init Error. Check Console.</div>';
}