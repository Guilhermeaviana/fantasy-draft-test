import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import PollBoardPage from './pages/PollBoardPage';
import PollPage from './pages/PollPage';

export default function App() {
    return (
        <BrowserRouter>
            <AppHeader />

            <Routes>
                <Route path="/" element={<PollBoardPage />} />
                <Route path="/polls/:pollId" element={<PollPage />} />
            </Routes>
        </BrowserRouter>
    );
}