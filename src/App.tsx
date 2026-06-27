import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';
import Todos from './pages/Todos';
import Time from './pages/Time';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Review from './pages/Review';
import Sync from './pages/Sync';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="todos" element={<Todos />} />
        <Route path="time" element={<Time />} />
        <Route path="habits" element={<Habits />} />
        <Route path="goals" element={<Goals />} />
        <Route path="review" element={<Review />} />
        <Route path="sync" element={<Sync />} />
      </Route>
    </Routes>
  );
}
