import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

/**
 * Registro único de los controladores/elementos de Chart.js usados por el
 * módulo de analíticas. Se importa por su efecto secundario antes de
 * renderizar cualquier gráfica (react-chartjs-2 no registra nada por sí solo).
 */
ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

export default ChartJS;
