const {
  runEmpathyAudit,
  formatEmpathyAuditReport,
} = require('cbrowser');

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000';

const DISABILITIES = [
  'motor-tremor',
  'low-vision',
  'adhd',
];

const ROUTES = [
  {
    name: 'Inicio',
    path: '/',
  },
  {
    name: 'Login',
    path: '/login',
  },
  {
    name: 'Registro',
    path: '/register',
  },
  {
    name: 'Permisos de cuenta',
    path: '/account/permissions',
  },
  {
    name: 'Nueva evaluación',
    path: '/evaluacion/1?project_id=10',
  },
  {
    name: 'Evaluación con progreso',
    path: '/evaluacion/1?project_id=10&evaluation_id=42',
  },
];

async function auditRoute(route) {
  const url = `${FRONTEND_URL}${route.path}`;

  console.log('');
  console.log('==========================================');
  console.log(` AUDITANDO: ${route.name}`);
  console.log('==========================================');
  console.log(`URL: ${url}`);
  console.log('');

  try {
    const result = await runEmpathyAudit(url, {
      goal:
        'evaluate the accessibility and usability of the heuristic evaluation module',
      disabilities: DISABILITIES,
      wcagLevel: 'AA',
      maxSteps: 20,
      maxTime: 120,
      headless: true,
    });

    console.log('');
    console.log(`RESULTADO: ${route.name}`);
    console.log('------------------------------------------');
    console.log(formatEmpathyAuditReport(result));

    return {
      route,
      result,
      success: true,
    };
  } catch (error) {
    console.error('');
    console.error(`ERROR EN: ${route.name}`);
    console.error(`URL: ${url}`);
    console.error(error.message || error);

    return {
      route,
      error,
      success: false,
    };
  }
}

async function main() {
  console.log('==========================================');
  console.log(' CBROWSER ACCESSIBILITY / EMPATHY SCANNER');
  console.log('==========================================');
  console.log(`Base URL: ${FRONTEND_URL}`);
  console.log('');

  console.log('Discapacidades evaluadas:');
  console.log('- Motor tremor');
  console.log('- Low vision');
  console.log('- ADHD');
  console.log('');

  console.log('Rutas a evaluar:');

  ROUTES.forEach((route, index) => {
    console.log(`${index + 1}. ${route.name} -> ${route.path}`);
  });

  console.log('');
  console.log(`Total de rutas: ${ROUTES.length}`);
  console.log('');

  const results = [];

  for (const route of ROUTES) {
    const result = await auditRoute(route);
    results.push(result);
  }

  console.log('');
  console.log('');
  console.log('==========================================');
  console.log(' RESUMEN FINAL');
  console.log('==========================================');
  console.log('');

  results.forEach((item, index) => {
    const status = item.success ? 'Hechas:' : 'Errores:';

    console.log(
      `${status} ${index + 1}. ${item.route.name} -> ${item.route.path}`
    );
  });

  const successful = results.filter((item) => item.success).length;
  const failed = results.length - successful;

  console.log('');
  console.log(`Rutas evaluadas: ${results.length}`);
  console.log(`Exitosas: ${successful}`);
  console.log(`Con error: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log(
      'Algunas rutas no pudieron ser evaluadas. Esto no significa necesariamente que tengan problemas de accesibilidad; puede tratarse de autenticación, navegación o configuración.'
    );
  }

  console.log('');
  console.log('Scanner finalizado.');
}

main().catch((error) => {
  console.error('');
  console.error('Accessibility scanner failed.');
  console.error(error);
  process.exitCode = 1;
});