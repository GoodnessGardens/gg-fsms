import { cookies } from "next/headers";

export function getLang() {
  return cookies().get("lang")?.value === "es" ? "es" : "en";
}

export const pick = (lang, obj) => (obj && typeof obj === "object" ? obj[lang] || obj.en : obj);

const STR = {
  en: {
    home: "Home", training: "Training", checklists: "Checklists", incidents: "Incidents", admin: "Admin", logout: "Log out",
    welcome: "Welcome", role: "Role", myTraining: "My Required Training", program: "Program", status: "Status",
    lastPassed: "Last Passed", takeQuiz: "Take course", retake: "Retake", current: "Current", overdue: "Overdue",
    notTaken: "Not taken", expiresIn: "Expires in", validFor: "Training is valid for 365 days.", viewHistory: "View my full history",
    checklistsCard: "Submit daily/weekly safety inspections.", open: "Open checklists", reportCard: "Injury, near miss, damage — report same shift.",
    reportNow: "Report now", openIncidents: "Open Incidents", review: "Review",
    signIn: "Sign In", employeeId: "Employee ID", pin: "PIN", signingIn: "Signing in…", askSupervisor: "Ask your supervisor if you need an Employee ID or PIN reset.",
    programs: "Training Programs", dept: "Department", readFirst: "Read each chapter, then take the quiz. Passing score: 80%.",
    chapter: "Chapter", startQuiz: "Start the quiz", quiz: "Quiz", answerAll: "Answer all", questions: "questions",
    passing: "Passing score 80%. Your attempt is recorded either way.", ack: "I acknowledge that I received and understood the training for this safety program, had the opportunity to ask questions, and agree to follow these procedures. I understand I must report hazards and injuries immediately.",
    submitQuiz: "Submit Quiz & Sign Off", submitting: "Submitting…", answerEvery: "Answer every question to enable submission.",
    passed: "Passed", notPassed: "Not Passed", passedMsg: "Your training record and acknowledgment have been logged with today's date.",
    failedMsg: "Passing score is 80%. Review the program with your trainer, then retake. Missed questions:", backDash: "Back to dashboard",
    retakeQuiz: "Retake quiz", myHistory: "My History", trainingRecords: "Training Records", date: "Date", score: "Score", result: "Result",
    noRecords: "No training records yet.", mySubmissions: "My Checklist Submissions", checklist: "Checklist", issues: "Issues?",
    needsAction: "Needs action", allOk: "All OK", noSubs: "No submissions yet.", inspChecklists: "Inspection Checklists",
    start: "Start", recent: "Recent Submissions", by: "By", site: "Site", shift: "Shift", unit: "Unit / Equipment #",
    ok: "OK", action: "Needs Action", na: "N/A", describeIssue: "Describe the issue / corrective action", submitChecklist: "Submit Checklist",
    markEvery: "Mark every item to enable submission.", submitted: "Checklist submitted", issuesWarn: "Items need action. Report them to your supervisor now. Equipment that failed inspection must be tagged out of service until repaired.",
    backChecklists: "Back to checklists", reportIncident: "Report an Incident / Near Miss", reportBanner: "Report ALL incidents — injuries, near misses, damage, spills — before the end of your shift. Reporting in good faith is protected; you will never be retaliated against.",
    incDate: "Date & time of incident", type: "Type", location: "Exact location", persons: "Person(s) involved (name, job, shift)",
    what: "What happened, step by step?", injury: "Injury (body part & nature, if any)", treatment: "Treatment",
    equipment: "Equipment / materials / chemicals involved", conditions: "Conditions (lighting, floor, weather, heat, congestion)",
    immediate: "Immediate / interim actions taken", oshaQ: "Possible OSHA serious-event report needed? (fatality / hospitalization / amputation / eye)",
    submitReport: "Submit Incident Report", reported: "Incident reported", reportedNext: "Notify your supervisor verbally NOW if you haven't. Serious events must be reported to OSHA/VOSH/IOSHA within 8/24 hours — the Safety Coordinator handles this. Preserve the scene; the investigation begins within 24 hours.",
    myReports: "My Reports", allIncidents: "All Incidents", reportedBy: "Reported By", investigate: "Investigate", openStatus: "Open", closed: "Closed",
  },
  es: {
    home: "Inicio", training: "Capacitación", checklists: "Listas", incidents: "Incidentes", admin: "Admin", logout: "Salir",
    welcome: "Bienvenido(a)", role: "Rol", myTraining: "Mi Capacitación Requerida", program: "Programa", status: "Estado",
    lastPassed: "Última Aprobación", takeQuiz: "Tomar curso", retake: "Repetir", current: "Vigente", overdue: "Vencida",
    notTaken: "Sin tomar", expiresIn: "Vence en", validFor: "La capacitación es válida por 365 días.", viewHistory: "Ver mi historial completo",
    checklistsCard: "Envíe inspecciones de seguridad diarias/semanales.", open: "Abrir listas", reportCard: "Lesión, cuasi accidente, daño — reporte en el mismo turno.",
    reportNow: "Reportar ahora", openIncidents: "Incidentes Abiertos", review: "Revisar",
    signIn: "Iniciar Sesión", employeeId: "ID de Empleado", pin: "PIN", signingIn: "Entrando…", askSupervisor: "Pida a su supervisor un ID de empleado o restablecer su PIN.",
    programs: "Programas de Capacitación", dept: "Departamento", readFirst: "Lea cada capítulo y luego tome el examen. Calificación mínima: 80%.",
    chapter: "Capítulo", startQuiz: "Comenzar el examen", quiz: "Examen", answerAll: "Responda las", questions: "preguntas",
    passing: "Calificación mínima 80%. Su intento queda registrado de cualquier forma.", ack: "Reconozco que recibí y entendí la capacitación de este programa de seguridad, tuve oportunidad de hacer preguntas y me comprometo a seguir estos procedimientos. Entiendo que debo reportar peligros y lesiones de inmediato.",
    submitQuiz: "Enviar Examen y Firmar", submitting: "Enviando…", answerEvery: "Responda todas las preguntas para poder enviar.",
    passed: "Aprobado", notPassed: "No Aprobado", passedMsg: "Su registro de capacitación y firma quedaron guardados con la fecha de hoy.",
    failedMsg: "La calificación mínima es 80%. Repase el programa con su entrenador y vuelva a intentar. Preguntas falladas:", backDash: "Volver al inicio",
    retakeQuiz: "Repetir examen", myHistory: "Mi Historial", trainingRecords: "Registros de Capacitación", date: "Fecha", score: "Puntaje", result: "Resultado",
    noRecords: "Aún no hay registros.", mySubmissions: "Mis Listas Enviadas", checklist: "Lista", issues: "¿Problemas?",
    needsAction: "Requiere acción", allOk: "Todo bien", noSubs: "Aún no hay envíos.", inspChecklists: "Listas de Inspección",
    start: "Iniciar", recent: "Envíos Recientes", by: "Por", site: "Sede", shift: "Turno", unit: "Unidad / Equipo #",
    ok: "Bien", action: "Requiere Acción", na: "N/A", describeIssue: "Describa el problema / acción correctiva", submitChecklist: "Enviar Lista",
    markEvery: "Marque todos los puntos para poder enviar.", submitted: "Lista enviada", issuesWarn: "Hay puntos que requieren acción. Repórtelos a su supervisor ahora. El equipo que falló la inspección debe quedar fuera de servicio hasta repararse.",
    backChecklists: "Volver a las listas", reportIncident: "Reportar Incidente / Cuasi Accidente", reportBanner: "Reporte TODOS los incidentes — lesiones, cuasi accidentes, daños, derrames — antes del final de su turno. Reportar de buena fe está protegido; nunca habrá represalias.",
    incDate: "Fecha y hora del incidente", type: "Tipo", location: "Ubicación exacta", persons: "Persona(s) involucrada(s) (nombre, puesto, turno)",
    what: "¿Qué pasó, paso a paso?", injury: "Lesión (parte del cuerpo y tipo, si aplica)", treatment: "Tratamiento",
    equipment: "Equipo / materiales / químicos involucrados", conditions: "Condiciones (iluminación, piso, clima, calor, congestión)",
    immediate: "Acciones inmediatas / provisionales tomadas", oshaQ: "¿Posible reporte de evento grave a OSHA? (fatalidad / hospitalización / amputación / ojo)",
    submitReport: "Enviar Reporte", reported: "Incidente reportado", reportedNext: "Avise verbalmente a su supervisor AHORA si no lo ha hecho. Los eventos graves se reportan a OSHA/VOSH/IOSHA en 8/24 horas — el Coordinador de Seguridad se encarga. Preserve la escena; la investigación comienza dentro de 24 horas.",
    myReports: "Mis Reportes", allIncidents: "Todos los Incidentes", reportedBy: "Reportado Por", investigate: "Investigar", openStatus: "Abierto", closed: "Cerrado",
  },
};

export const t = (lang) => STR[lang] || STR.en;
