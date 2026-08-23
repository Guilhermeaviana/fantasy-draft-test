import {
    BrowserRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom';

import {
    useEffect,
} from 'react';

import AppHeader from './components/AppHeader';
import PollBoardPage from './pages/PollBoardPage';
import PollPage from './pages/PollPage';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto',
        });
    }, [pathname]);

    return null;
}

export default function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />

            <AppHeader />

            <Routes>
                <Route
                    path="/"
                    element={<PollBoardPage />}
                />

                <Route
                    path="/polls/:pollId"
                    element={<PollPage />}
                />
            </Routes>
        </BrowserRouter>
    );
}