import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import GenrePage from "./pages/GenrePage";
import Admin from "./pages/Admin";
import TvDetail from "./pages/TvDetail";
import Favorites from "./pages/Favorites";
import ColorDirections from "./pages/ColorDirections";
import Requests from "./pages/Requests";
import { FavoritesProvider } from "./hooks/useFavorites";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/search"} component={Search} />
      <Route path={"/movie/:id"} component={MovieDetail} />
      <Route path={"/genre/:id"} component={GenrePage} />
      <Route path={"/tv/:id"} component={TvDetail} />
      <Route path={"/favorites"} component={Favorites} />
      <Route path={"/requests"} component={Requests} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/_color-directions"} component={ColorDirections} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// MIDNIGHT MARQUEE — the dark cinema palette remains the default, while the
// switchable provider lets visitors choose a softer light screening mode.

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
