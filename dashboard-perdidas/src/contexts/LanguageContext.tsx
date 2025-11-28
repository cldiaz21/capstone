import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    // Navbar
    'nav.control': 'Control de Pérdidas',
    'nav.marisol': 'Comercial Marisol',
    'nav.logout': 'Cerrar Sesión',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',
    
    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.pesaje': 'Pesaje en Vivo',
    'sidebar.factories': 'Fábricas',
    'sidebar.sacks': 'Sacos',
    'sidebar.losses': 'Pérdidas',
    'sidebar.reports': 'Reportes',
    'sidebar.admin': 'Administración',
    
    // Login
    'login.title': 'Comercial Marisol',
    'login.subtitle': 'Sistema de Control de Pérdidas',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.button': 'Iniciar Sesión',
    'login.loading': 'Iniciando sesión...',
    
    // Dashboard
    'dashboard.totalOrders': 'Total Pedidos',
    'dashboard.totalReceived': 'Total Recibidos',
    'dashboard.totalLosses': 'Total Pérdidas',
    'dashboard.avgRatio': 'Ratio Promedio',
    'dashboard.topLosses': 'Top 10 Fábricas con Mayores Pérdidas',
    'dashboard.monthlyTrend': 'Tendencia Mensual de Pérdidas',
    'dashboard.lossDistribution': 'Distribución de Pérdidas',
    
    // Usuarios
    'users.title': 'Administración de Usuarios',
    'users.create': 'Crear Usuario',
    'users.edit': 'Editar Usuario',
    'users.delete': 'Eliminar Usuario',
    'users.email': 'Email',
    'users.name': 'Nombre Completo',
    'users.role': 'Rol',
    'users.active': 'Activo',
    'users.actions': 'Acciones',
    
    // Roles
    'role.admin': 'Administrador',
    'role.supervisor': 'Supervisor',
    'role.operador': 'Operador',
    'role.visualizador': 'Visualizador',
    
    // Botones generales
    'button.save': 'Guardar',
    'button.cancel': 'Cancelar',
    'button.delete': 'Eliminar',
    'button.edit': 'Editar',
    'button.close': 'Cerrar',
    'button.confirm': 'Confirmar',
    
    // Mensajes
    'message.loading': 'Cargando...',
    'message.error': 'Error',
    'message.success': 'Éxito',
    'message.noData': 'No hay datos disponibles',
  },
  ko: {
    // Navbar
    'nav.control': '손실 관리',
    'nav.marisol': '코메르시알 마리솔',
    'nav.logout': '로그아웃',
    'nav.profile': '프로필',
    'nav.settings': '설정',
    
    // Sidebar
    'sidebar.dashboard': '대시보드',
    'sidebar.pesaje': '실시간 계량',
    'sidebar.factories': '공장',
    'sidebar.sacks': '포대',
    'sidebar.losses': '손실',
    'sidebar.reports': '보고서',
    'sidebar.admin': '관리',
    
    // Login
    'login.title': '코메르시알 마리솔',
    'login.subtitle': '손실 관리 시스템',
    'login.email': '이메일',
    'login.password': '비밀번호',
    'login.button': '로그인',
    'login.loading': '로그인 중...',
    
    // Dashboard
    'dashboard.totalOrders': '총 주문',
    'dashboard.totalReceived': '총 수령',
    'dashboard.totalLosses': '총 손실',
    'dashboard.avgRatio': '평균 비율',
    'dashboard.topLosses': '손실이 가장 많은 상위 10개 공장',
    'dashboard.monthlyTrend': '월별 손실 추세',
    'dashboard.lossDistribution': '손실 분포',
    
    // Usuarios
    'users.title': '사용자 관리',
    'users.create': '사용자 생성',
    'users.edit': '사용자 편집',
    'users.delete': '사용자 삭제',
    'users.email': '이메일',
    'users.name': '전체 이름',
    'users.role': '역할',
    'users.active': '활성',
    'users.actions': '작업',
    
    // Roles
    'role.admin': '관리자',
    'role.supervisor': '감독자',
    'role.operador': '운영자',
    'role.visualizador': '뷰어',
    
    // Botones generales
    'button.save': '저장',
    'button.cancel': '취소',
    'button.delete': '삭제',
    'button.edit': '편집',
    'button.close': '닫기',
    'button.confirm': '확인',
    
    // Mensajes
    'message.loading': '로딩 중...',
    'message.error': '오류',
    'message.success': '성공',
    'message.noData': '데이터 없음',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translationObj = translations[language] as Record<string, string>;
    return translationObj[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
