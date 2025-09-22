const mysql = require('mysql2');
require('dotenv').config();

console.log('========================================');
console.log('  PRUEBA DE CONEXION A BASE DE DATOS');
console.log('========================================\n');

// Mostrar configuración actual
console.log('📋 Configuración actual:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Puerto: ${process.env.DB_PORT || 3306}`);
console.log(`   Usuario: ${process.env.DB_USER}`);
console.log(`   Base de datos: ${process.env.DB_NAME}`);
console.log(`   Contraseña: ${process.env.DB_PASSWORD ? '****' : '(vacía)'}`);
console.log('\n');

// Crear conexión
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000 // 10 segundos de timeout
});

console.log('🔄 Intentando conectar...\n');

// Intentar conectar
connection.connect((err) => {
  if (err) {
    console.error('❌ ERROR DE CONEXION:\n');
    console.error(`   Código: ${err.code}`);
    console.error(`   Mensaje: ${err.message}`);
    console.error(`   Error SQL: ${err.sqlMessage || 'N/A'}`);
    console.error(`   Estado SQL: ${err.sqlState || 'N/A'}`);
    
    console.log('\n========================================');
    console.log('  POSIBLES SOLUCIONES');
    console.log('========================================\n');
    
    if (err.code === 'ECONNREFUSED') {
      console.log('1. MySQL no está ejecutándose en el servidor');
      console.log('2. El puerto 3306 está bloqueado por el firewall');
      console.log('3. MySQL no acepta conexiones remotas');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('1. El servidor no es accesible desde esta red');
      console.log('2. Verifica que estés en la misma red');
      console.log('3. El firewall está bloqueando la conexión');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('1. Usuario o contraseña incorrectos');
      console.log('2. El usuario no tiene permisos desde esta IP');
      console.log('3. Ejecuta en el servidor:');
      console.log(`   GRANT ALL ON ${process.env.DB_NAME}.* TO '${process.env.DB_USER}'@'%';`);
      console.log('   FLUSH PRIVILEGES;');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.log(`1. La base de datos '${process.env.DB_NAME}' no existe`);
      console.log('2. Crea la base de datos en el servidor');
    } else if (err.code === 'ER_HOST_NOT_PRIVILEGED') {
      console.log('1. Tu IP no tiene permisos para conectarse');
      console.log('2. En el servidor MySQL, ejecuta:');
      console.log(`   GRANT ALL ON *.* TO '${process.env.DB_USER}'@'%' IDENTIFIED BY '${process.env.DB_PASSWORD}';`);
      console.log('   FLUSH PRIVILEGES;');
    }
    
    process.exit(1);
  } else {
    console.log('✅ CONEXION EXITOSA!\n');
    
    // Hacer una consulta de prueba
    connection.query('SELECT 1 + 1 AS resultado', (err, results) => {
      if (err) {
        console.error('❌ Error en consulta de prueba:', err.message);
      } else {
        console.log('✅ Consulta de prueba exitosa: 1 + 1 =', results[0].resultado);
      }
      
      // Verificar si las tablas existen
      connection.query('SHOW TABLES', (err, results) => {
        if (err) {
          console.error('❌ Error al listar tablas:', err.message);
        } else {
          console.log(`\n📊 Tablas en la base de datos (${results.length} encontradas):`);
          results.forEach(row => {
            const tableName = Object.values(row)[0];
            console.log(`   - ${tableName}`);
          });
        }
        
        connection.end(() => {
          console.log('\n✅ Conexión cerrada correctamente');
          process.exit(0);
        });
      });
    });
  }
});
