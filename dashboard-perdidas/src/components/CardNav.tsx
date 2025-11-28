import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { IoNotifications } from 'react-icons/io5';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import './CardNav.css';

interface NavLink {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

interface NavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: NavLink[];
}

interface CardNavProps {
  logo: string;
  logoAlt?: string;
  logoText?: string;
  items: NavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  onEditProfile: () => void;
  notificationCount?: number;
  onNotificationClick: () => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  buttonBgColor,
  buttonTextColor,
  onEditProfile,
  notificationCount: _notificationCount = 0,
  onNotificationClick
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [realNotificationCount, setRealNotificationCount] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const { language, setLanguage } = useLanguage();

  // Cargar notificaciones reales desde Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('perdidas')
          .select('*')
          .gt('porcentaje_perdida', 3)
          .gte('fecha', sevenDaysAgo.toISOString())
          .order('fecha', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRealNotificationCount(data?.length || 0);
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
        setRealNotificationCount(0);
      }
    };

    fetchNotifications();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 280;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        // Force reflow
        void contentEl.offsetHeight;

        const topBar = 65;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 280;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <img src={logo} alt={logoAlt} className="logo" />
          </div>

          <div className="card-nav-actions">
            {/* Selector de idioma */}
            <div className="language-selector">
              <a
                onClick={() => setLanguage('es')}
                className={`language-link ${language === 'es' ? 'active' : ''}`}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                ESP
              </a>
              <span className="language-separator">/</span>
              <a
                onClick={() => setLanguage('ko')}
                className={`language-link ${language === 'ko' ? 'active' : ''}`}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                한국어
              </a>
            </div>

            <button
              type="button"
              className="notification-button"
              onClick={onNotificationClick}
              aria-label="Notificaciones"
            >
              <IoNotifications />
              {realNotificationCount > 0 && (
                <span className="notification-badge">{realNotificationCount}</span>
              )}
            </button>

            <button
              type="button"
              className="card-nav-cta-button"
              onClick={onEditProfile}
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              Editar Perfil
            </button>
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ 
                background: item.bgColor, 
                color: item.textColor 
              }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    onClick={(e) => {
                      e.preventDefault();
                      lnk.onClick();
                      toggleMenu(); // Cerrar menú al hacer click
                    }}
                    aria-label={lnk.ariaLabel}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
