// Arreglo para almacenar los registros
let registros = JSON.parse(localStorage.getItem('registros')) || [];

// Función para actualizar registros antiguos
function actualizarRegistrosAntiguos() {
    let registrosActualizados = false;
    registros.forEach(registro => {
        // Si el registro tiene 'excesoMinutos' y no tiene 'excesoJornada', actualizamos
        if (registro.excesoMinutos !== undefined && registro.excesoJornada === undefined) {
            registro.excesoJornada = registro.excesoMinutos;
            delete registro.excesoMinutos;
            registrosActualizados = true;
        }
        // Si 'excesoJornada' está indefinido, inicializamos a '00:00'
        if (registro.excesoJornada === undefined) {
            registro.excesoJornada = '00:00';
            registrosActualizados = true;
        }
    });
    if (registrosActualizados) {
        localStorage.setItem('registros', JSON.stringify(registros));
    }
}

// Llamar a la función para actualizar registros antiguos
actualizarRegistrosAntiguos();

// Referencias a los elementos del DOM
const guardarBtn = document.getElementById('guardarBtn');
const diaLibreBtn = document.getElementById('diaLibreBtn');

// Asignación de eventos a los botones
guardarBtn.addEventListener('click', guardarRegistro);
diaLibreBtn.addEventListener('click', diaLibre);

// Escuchar cambios en los campos relevantes para actualizar los cálculos en tiempo real
const camposParaEscuchar = ['horaInicio', 'horaFin', 'loginExp', 'logoutExp', 'billetesVendidos'];
camposParaEscuchar.forEach(campoId => {
    document.getElementById(campoId).addEventListener('input', actualizarCamposCalculados);
});

// Inicializar la tabla al cargar la página
actualizarTabla();

// Función para guardar o actualizar un registro
function guardarRegistro() {
    const fecha = document.getElementById('fecha').value;
    if (!fecha) {
        alert('Por favor, ingresa la fecha.');
        return;
    }

    const registro = {
        fecha,
        numeroConductor: document.getElementById('numeroConductor').value || '0',
        linea: document.getElementById('linea').value || '',
        numeroTurno: document.getElementById('numeroTurno').value || '0',
        horaInicio: document.getElementById('horaInicio').value || '00:00',
        horaFin: document.getElementById('horaFin').value || '00:00',
        loginExp: document.getElementById('loginExp').value || '00:00',
        logoutExp: document.getElementById('logoutExp').value || '00:00',
        numeroAutobus: document.getElementById('numeroAutobus').value || '0',
        totalViajeros: parseInt(document.getElementById('totalViajeros').value) || 0,
        billetesVendidos: parseInt(document.getElementById('billetesVendidos').value) || 0,
        observaciones: document.getElementById('observaciones').value || ''
    };

    // Cálculos automáticos
    registro.tiempoTotalHoja = calcularDiferenciaHoras(registro.horaInicio, registro.horaFin);
    registro.tiempoTotalOperativo = calcularDiferenciaHoras(registro.loginExp, registro.logoutExp);
    registro.excesoJornada = calcularExcesoJornada(registro.horaFin, registro.logoutExp);
    registro.liquidacionTotal = (registro.billetesVendidos * 1.30).toFixed(2);

    // Verificar si ya existe un registro para esa fecha
    const indice = registros.findIndex(r => r.fecha === fecha);
    if (indice >= 0) {
        registros[indice] = registro;
    } else {
        registros.push(registro);
    }

    // Guardar en localStorage
    localStorage.setItem('registros', JSON.stringify(registros));
    actualizarTabla();
    actualizarCamposCalculados(); // Actualizar los campos calculados en el formulario
}

// Función para Día Libre
function diaLibre() {
    const fecha = document.getElementById('fecha').value;
    const numeroConductor = document.getElementById('numeroConductor').value;

    if (!fecha || !numeroConductor) {
        alert('Por favor, ingresa la fecha y el número de conductor.');
        return;
    }

    // Asignar valores predeterminados
    document.getElementById('linea').value = 'DÍA LIBRE';
    document.getElementById('numeroTurno').value = '0';
    document.getElementById('horaInicio').value = '00:00';
    document.getElementById('horaFin').value = '00:00';
    document.getElementById('loginExp').value = '00:00';
    document.getElementById('logoutExp').value = '00:00';
    document.getElementById('numeroAutobus').value = '0';
    document.getElementById('totalViajeros').value = 0;
    document.getElementById('billetesVendidos').value = 0;
    document.getElementById('observaciones').value = 'DÍA LIBRE';

    // Actualizar campos calculados
    actualizarCamposCalculados();

    // Guardar el registro
    guardarRegistro();
}

// Función para actualizar los campos calculados en el formulario
function actualizarCamposCalculados() {
    // Obtener los valores actuales del formulario
    const horaInicio = document.getElementById('horaInicio').value || '00:00';
    const horaFin = document.getElementById('horaFin').value || '00:00';
    const loginExp = document.getElementById('loginExp').value || '00:00';
    const logoutExp = document.getElementById('logoutExp').value || '00:00';
    const billetesVendidos = parseInt(document.getElementById('billetesVendidos').value) || 0;

    // Recalcular los campos
    const tiempoTotalHoja = calcularDiferenciaHoras(horaInicio, horaFin);
    const tiempoTotalOperativo = calcularDiferenciaHoras(loginExp, logoutExp);
    const excesoJornada = calcularExcesoJornada(horaFin, logoutExp);
    const liquidacionTotal = (billetesVendidos * 1.30).toFixed(2);

    // Actualizar los campos en el formulario
    document.getElementById('tiempoTotalHoja').value = tiempoTotalHoja;
    document.getElementById('tiempoTotalOperativo').value = tiempoTotalOperativo;
    document.getElementById('excesoJornada').value = excesoJornada;
    document.getElementById('liquidacionTotal').value = liquidacionTotal;
}

// Función para actualizar las tablas
function actualizarTabla() {
    const contenedorTablas = document.getElementById('tablasMensuales');
    contenedorTablas.innerHTML = '';

    // Agrupar registros por año y mes
    const registrosPorAno = {};

    registros.forEach(registro => {
        const fechaRegistro = new Date(registro.fecha);
        const mes = fechaRegistro.getMonth(); // 0-11
        const ano = fechaRegistro.getFullYear();

        if (!registrosPorAno[ano]) {
            registrosPorAno[ano] = {
                registrosPorMes: {},
                totalAnualTiempoHoja: 0,
                totalAnualTiempoOperativo: 0,
                totalAnualExcesoJornada: 0,
                totalAnualViajeros: 0,
                totalAnualBilletesVendidos: 0,
                totalAnualLiquidacion: 0
            };
        }

        const registrosAno = registrosPorAno[ano];

        if (!registrosAno.registrosPorMes[mes]) {
            registrosAno.registrosPorMes[mes] = [];
        }

        // Asegurarse de que excesoJornada esté definido
        if (registro.excesoJornada === undefined) {
            registro.excesoJornada = '00:00';
        }

        registrosAno.registrosPorMes[mes].push(registro);

        // Acumulación de totales anuales
        const tiempoHojaMinutos = convertirATotalMinutos(registro.tiempoTotalHoja);
        const tiempoOperativoMinutos = convertirATotalMinutos(registro.tiempoTotalOperativo);
        const excesoJornadaMinutos = convertirATotalMinutos(registro.excesoJornada);

        registrosAno.totalAnualTiempoHoja += tiempoHojaMinutos;
        registrosAno.totalAnualTiempoOperativo += tiempoOperativoMinutos;
        registrosAno.totalAnualExcesoJornada += excesoJornadaMinutos;
        registrosAno.totalAnualViajeros += registro.totalViajeros;
        registrosAno.totalAnualBilletesVendidos += registro.billetesVendidos;
        registrosAno.totalAnualLiquidacion += parseFloat(registro.liquidacionTotal);
    });

    // Obtener los años ordenados de más reciente a más antiguo
    const anosOrdenados = Object.keys(registrosPorAno).sort((a, b) => b - a);

    anosOrdenados.forEach(ano => {
        const registrosAno = registrosPorAno[ano];
        const registrosPorMes = registrosAno.registrosPorMes;

        // Crear un contenedor para el año
        const contenedorAno = document.createElement('div');
        contenedorAno.classList.add('year-container');
        contenedorAno.innerHTML = `<h1>${ano}</h1>`;

        // Obtener los meses ordenados de más reciente a más antiguo
        const mesesOrdenados = Object.keys(registrosPorMes).sort((a, b) => b - a);

        mesesOrdenados.forEach(mes => {
            const registrosMes = registrosPorMes[mes];

            // Calcular totales mensuales
            let totalMensualTiempoHoja = 0;
            let totalMensualTiempoOperativo = 0;
            let totalMensualExcesoJornada = 0;
            let totalMensualViajeros = 0;
            let totalMensualBilletesVendidos = 0;
            let totalMensualLiquidacion = 0;

            registrosMes.forEach(registro => {
                const tiempoHojaMinutos = convertirATotalMinutos(registro.tiempoTotalHoja);
                const tiempoOperativoMinutos = convertirATotalMinutos(registro.tiempoTotalOperativo);
                const excesoJornadaMinutos = convertirATotalMinutos(registro.excesoJornada);

                totalMensualTiempoHoja += tiempoHojaMinutos;
                totalMensualTiempoOperativo += tiempoOperativoMinutos;
                totalMensualExcesoJornada += excesoJornadaMinutos;
                totalMensualViajeros += registro.totalViajeros;
                totalMensualBilletesVendidos += registro.billetesVendidos;
                totalMensualLiquidacion += parseFloat(registro.liquidacionTotal);
            });

            // Crear la tabla mensual
            const tablaMensual = document.createElement('div');
            tablaMensual.classList.add('monthly-table');

            const nombreMes = obtenerNombreMes(mes);

            tablaMensual.innerHTML = `
                <h2>${nombreMes} ${ano}</h2>
                <button class="exportar-mes-btn">Guardar en Excel (CSV)</button>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>N° Conductor</th>
                            <th>Línea</th>
                            <th>N° Turno</th>
                            <th>Inicio (Hoja)</th>
                            <th>Fin (Hoja)</th>
                            <th>Tiempo Total Hoja</th>
                            <th>Login Exp</th>
                            <th>Logout Exp</th>
                            <th>Tiempo Total Operativo</th>
                            <th>Exceso de Jornada</th>
                            <th>N° Autobús</th>
                            <th>Total Viajeros</th>
                            <th>Billetes Vendidos</th>
                            <th>Liquidación Total (€)</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6">Total Mensual</td>
                            <td>${convertirAHorasMinutos(totalMensualTiempoHoja)}</td>
                            <td></td>
                            <td></td>
                            <td>${convertirAHorasMinutos(totalMensualTiempoOperativo)}</td>
                            <td>${convertirAHorasMinutos(totalMensualExcesoJornada)}</td>
                            <td></td>
                            <td>${totalMensualViajeros}</td>
                            <td>${totalMensualBilletesVendidos}</td>
                            <td>${totalMensualLiquidacion.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            `;

            const tbody = tablaMensual.querySelector('tbody');

            // Ordenar los registros del mes por fecha descendente (más reciente primero)
            registrosMes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            registrosMes.forEach(registro => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${registro.fecha}</td>
                    <td>${registro.numeroConductor}</td>
                    <td>${registro.linea}</td>
                    <td>${registro.numeroTurno}</td>
                    <td>${registro.horaInicio}</td>
                    <td>${registro.horaFin}</td>
                    <td>${registro.tiempoTotalHoja}</td>
                    <td>${registro.loginExp}</td>
                    <td>${registro.logoutExp}</td>
                    <td>${registro.tiempoTotalOperativo}</td>
                    <td>${registro.excesoJornada || '00:00'}</td>
                    <td>${registro.numeroAutobus}</td>
                    <td>${registro.totalViajeros}</td>
                    <td>${registro.billetesVendidos}</td>
                    <td>${registro.liquidacionTotal}</td>
                    <td>${registro.observaciones}</td>
                `;

                // Verificar si hay exceso de jornada y el valor no es '00:00' o vacío
                if (registro.excesoJornada && registro.excesoJornada !== '00:00') {
                    const celdas = row.getElementsByTagName('td');
                    const celdaExcesoJornada = celdas[10];
                    celdaExcesoJornada.style.backgroundColor = 'yellow';
                    celdaExcesoJornada.style.fontWeight = 'bold';
                }

                // Si es día libre, pintar la fila de azul claro
                if (registro.observaciones && (registro.observaciones.toUpperCase().includes('DÍA LIBRE') || registro.observaciones.toUpperCase().includes('DIA LIBRE'))) {
                    row.style.backgroundColor = '#add8e6'; // Color azul claro
                }

                tbody.appendChild(row);
            });

            // Añadir evento al botón de exportar para este mes
            const exportarMesBtn = tablaMensual.querySelector('.exportar-mes-btn');
            exportarMesBtn.addEventListener('click', () => {
                exportarCSV(registrosMes, `${nombreMes}_${ano}`);
            });

            // Añadir la tabla mensual al contenedor del año
            contenedorAno.appendChild(tablaMensual);
        });

        // Añadir la tabla de totales anuales para este año
        const tablaAnual = document.createElement('table');
        tablaAnual.innerHTML = `
            <thead>
                <tr>
                    <th colspan="6">Descripción</th>
                    <th>Tiempo Total Hoja</th>
                    <th></th>
                    <th></th>
                    <th>Tiempo Total Operativo</th>
                    <th>Exceso de Jornada</th>
                    <th></th>
                    <th>Total Viajeros</th>
                    <th>Billetes Vendidos</th>
                    <th>Liquidación Total (€)</th>
                    <th></th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td colspan="6">Total Anual ${ano}</td>
                    <td>${convertirAHorasMinutos(registrosAno.totalAnualTiempoHoja)}</td>
                    <td></td>
                    <td></td>
                    <td>${convertirAHorasMinutos(registrosAno.totalAnualTiempoOperativo)}</td>
                    <td>${convertirAHorasMinutos(registrosAno.totalAnualExcesoJornada)}</td>
                    <td></td>
                    <td>${registrosAno.totalAnualViajeros}</td>
                    <td>${registrosAno.totalAnualBilletesVendidos}</td>
                    <td>${registrosAno.totalAnualLiquidacion.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        `;

        contenedorAno.appendChild(tablaAnual);

        // Añadir el contenedor del año al contenedor principal
        contenedorTablas.appendChild(contenedorAno);
    });
}

// Función para obtener el nombre del mes
function obtenerNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes];
}

// Función para calcular diferencia de horas
function calcularDiferenciaHoras(inicio, fin) {
    if (!inicio || !fin) return '00:00';
    const [inicioHoras, inicioMinutos] = inicio.split(':').map(Number);
    const [finHoras, finMinutos] = fin.split(':').map(Number);

    let inicioTotalMinutos = inicioHoras * 60 + inicioMinutos;
    let finTotalMinutos = finHoras * 60 + finMinutos;

    if (finTotalMinutos < inicioTotalMinutos) {
        finTotalMinutos += 1440; // Añade 24 horas si el fin es después de medianoche
    }

    const diff = finTotalMinutos - inicioTotalMinutos;
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    return `${pad(horas)}:${pad(minutos)}`;
}

// Función para calcular exceso de jornada según la especificación corregida
function calcularExcesoJornada(horaFinHoja, logoutExp) {
    if (!horaFinHoja || !logoutExp) return '00:00';
    const [finHojaHoras, finHojaMinutos] = horaFinHoja.split(':').map(Number);
    const [logoutHoras, logoutMinutos] = logoutExp.split(':').map(Number);

    let finHojaTotalMinutos = finHojaHoras * 60 + finHojaMinutos;
    let logoutTotalMinutos = logoutHoras * 60 + logoutMinutos;

    let diff = logoutTotalMinutos - finHojaTotalMinutos;

    if (diff >= 0) {
        // Logout es después de la hora fin
        return formatDiff(diff);
    } else {
        // diff < 0
        if (Math.abs(diff) > 720) {
            // Posible cruce de medianoche
            logoutTotalMinutos += 1440; // Añade 24 horas
            diff = logoutTotalMinutos - finHojaTotalMinutos;
            if (diff >= 0) {
                return formatDiff(diff);
            } else {
                return '00:00';
            }
        } else {
            // Logout es antes de la hora fin, no hay exceso de jornada
            return '00:00';
        }
    }
}

// Función para formatear la diferencia en formato HH:MM
function formatDiff(diff) {
    if (diff > 0) {
        const horas = Math.floor(diff / 60);
        const minutos = diff % 60;
        return `${pad(horas)}:${pad(minutos)}`;
    } else {
        return '00:00';
    }
}

// Función para agregar ceros a la izquierda
function pad(num) {
    return num.toString().padStart(2, '0');
}

// Funciones de conversión
function convertirATotalMinutos(horaMinuto) {
    if (!horaMinuto || horaMinuto === 'undefined') return 0;
    const [horas, minutos] = horaMinuto.split(':').map(Number);
    return horas * 60 + minutos;
}

function convertirAHorasMinutos(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${pad(horas)}:${pad(minutos)}`;
}

// Función para exportar a CSV
function exportarCSV(registrosAExportar, nombreArchivo) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Número de Conductor,Línea,Número de Turno,Hora Inicio Hoja,Hora Fin Hoja,Tiempo Total Hoja,Login Exp,Logout Exp,Tiempo Total Operativo,Exceso de Jornada,Número de Autobús,Número Total de Viajeros,Número de Billetes Vendidos,Liquidación Total (€),Observaciones\n";

    registrosAExportar.forEach(registro => {
        const row = [
            registro.fecha,
            registro.numeroConductor,
            registro.linea,
            registro.numeroTurno,
            registro.horaInicio,
            registro.horaFin,
            registro.tiempoTotalHoja,
            registro.loginExp,
            registro.logoutExp,
            registro.tiempoTotalOperativo,
            registro.excesoJornada || '00:00',
            registro.numeroAutobus,
            registro.totalViajeros,
            registro.billetesVendidos,
            registro.liquidacionTotal,
            registro.observaciones
        ].join(",");
        csvContent += row + "\n";
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${nombreArchivo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
