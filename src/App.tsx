import './App.css'
import { BackgroundIconPlugin } from './components/charts/chart-plugins/BackgrounIconPlugin.tsx';
import OverviewLayout from "./components/layout/OverviewLayout.tsx";
import {Chart} from "chart.js";
import ChartAnnotation from "chartjs-plugin-annotation";


function App() {
    Chart.register(ChartAnnotation, BackgroundIconPlugin);
    return <div>
        <OverviewLayout/>
    </div>
}

export default App
