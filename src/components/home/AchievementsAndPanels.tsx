'use client';

import { memo, startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Award, ChevronDown, GraduationCap, IdCard, Medal, Trophy, UsersRound } from 'lucide-react';
import { subscribeToAchievements, type FirestoreAchievement } from '@/lib/publicData';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { Parallax } from '@/components/fx/Parallax';
import { TiltCard } from '@/components/fx/TiltCard';
import { RiseIn } from '@/components/fx/RiseIn';
import styles from './AchievementsAndPanels.module.css';

type PanelKey = '2026' | '2025' | '2024' | '2023' | 'founder';
type AwardLevel = 'Global' | 'National';

type Achievement = {
  title: string;
  recipients: string;
  competition: string;
  level: AwardLevel;
  year: number;
};

type ExecutiveMember = {
  name: string;
  designation: string;
  collegeId?: string;
  imageUrl?: string;
  imageFrame?: 'portrait' | 'square' | 'wide';
};

type PanelData = {
  label: string;
  eyebrow: string;
  description: string;
  achievements: Achievement[];
  executive_panel: ExecutiveMember[];
  moderators?: ExecutiveMember[];
};

/*
 * Update this object as new results and committee members are confirmed. The
 * achievement filter below uses the actual year stored on every record, so a
 * selected year never includes records from an earlier or later season.
 */
const panels: Record<PanelKey, PanelData> = {
  '2026': {
    label: 'Executive Committee 26',
    eyebrow: 'CURRENT LEADERSHIP',
    description: 'The committee leading ACCRC\u2019s next season of building, learning, and competition.',
    achievements: [
      {
        title: 'Grand Prize / 1st Place',
        recipients: 'Masroor Ali Neil',
        competition: 'Teens Dream Changemakers Video Challenge 2026 \u2014 \u201cCochlea Cap\u201d wearable assistive device',
        level: 'Global',
        year: 2026,
      },
      {
        title: 'Environmental Project Display \u2014 2nd Runners Up',
        recipients: 'Team ZERON',
        competition: "Green Genesis '26",
        level: 'National',
        year: 2026,
      },
      {
        title: 'Climate Photography DSLR \u2014 Runners Up',
        recipients: 'Md. Tahsin Araf (252773, S13)',
        competition: "Green Genesis '26",
        level: 'National',
        year: 2026,
      },
      {
        title: 'Non-mechanical Project Showcase \u2014 Runners Up',
        recipients: 'Ayman',
        competition: 'WICE 2026',
        level: 'National',
        year: 2026,
      },
      {
        title: 'Robotics Olympiad \u2014 2nd Runners Up',
        recipients: 'Khalid Bin Walid',
        competition: 'INIT 2026',
        level: 'National',
        year: 2026,
      },
      {
        title: 'Academic Writing \u2014 Runners Up',
        recipients: 'Jihad Islam',
        competition: 'NDESC Space Summit 2026',
        level: 'National',
        year: 2026,
      },
      {
        title: 'Project Showcase \u2014 2nd Runners Up',
        recipients: 'Team Waterlloyd (Jihad Ul Islam, Tawhidul Islam, Azrin Zaman Inne)',
        competition: 'Project Showcase 2026',
        level: 'National',
        year: 2026,
      },
      {
        title: 'Project Showcase \u2014 1st Runners Up',
        recipients: 'Team Edu-RAG (Ashfaq Sadat, Khalid Bin Walid, Abdul Al Affan)',
        competition: 'Project Showcase 2026',
        level: 'National',
        year: 2026,
      },
    ],
    executive_panel: [
      {
        name: 'Masroor Ali Neil',
        designation: 'President',
        imageUrl: '/leadership/committee-26/photo_6170079490235634212_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Md. Shafayet Biswas',
        designation: 'General Secretary & CCP',
        imageUrl: '/leadership/committee-26/photo_6170079490235634213_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Fatema Tooz-Zohra Falguni',
        designation: 'Assistant General Secretary & ACCP',
        imageUrl: '/leadership/committee-26/photo_6170079490235634214_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Md. Farhad Hossain',
        designation: 'Organizing Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634215_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Waqil Chowdhury Jim',
        designation: 'Administrative Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634216_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Aisha Tabassum Probha',
        designation: 'Joint Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634217_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Mahdi Al Rayan Bhuiyan',
        designation: 'Head of Event Management',
        imageUrl: '/leadership/committee-26/photo_6170079490235634218_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Shahria Ahmed Arafat',
        designation: 'Vice President (Project)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634219_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Nusrat Jahan',
        designation: 'Vice President (IT)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634220_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Ayman Ibna Amir',
        designation: 'Vice President (Creative Works)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634221_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Mst. Sraboni Akter Mimi',
        designation: 'Vice President (Publication)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634222_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Azim Saikat Hassan Sagor',
        designation: 'Secretary of IT',
        imageUrl: '/leadership/committee-26/photo_6170079490235634223_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Mukaddim Rahman',
        designation: 'Secretary of Creative Works',
        imageUrl: '/leadership/committee-26/photo_6170079490235634224_y.webp',
        imageFrame: 'square',
      },
      {
        name: 'Shara Elahe',
        designation: 'Secretary of Content Writing',
        imageUrl: '/leadership/committee-26/shara-elahe.webp',
        imageFrame: 'square',
      },
      {
        name: 'Nabila Nawar',
        designation: 'Public Relations Officer',
        imageUrl: '/leadership/committee-26/nabila-nawar.webp',
        imageFrame: 'square',
      },
    ],
    moderators: [
      {
        name: 'Naimul Haque Naim',
        designation: 'Moderator',
        imageUrl: '/leadership/moderator-naimul-haque-naim.webp',
        imageFrame: 'wide',
      },
      {
        name: 'Prof. Md. Abdul Halim',
        designation: 'Co-Moderator',
        imageUrl: '/leadership/moderator-md-abdul-halim.webp',
        imageFrame: 'portrait',
      },
    ],
  },
  '2025': {
    label: "Advisor Panel / EC'25",
    eyebrow: 'LEADERSHIP ARCHIVE',
    description: 'A record of the EC\u201925 leadership team and the club\u2019s national and international recognition.',
    achievements: [
      {
        title: 'Individual Gold Medal',
        recipients: 'Taseen Mohammad',
        competition: 'International Olympiad on Climate Change and Environmental Issues (IOCE 2025), Russia',
        level: 'Global',
        year: 2025,
      },
      {
        title: 'Outstanding Presentation Award',
        recipients: 'Team Bangladesh \u2014 Taseen Mohammad, Mahdi Bin Ferdaus, Md Ashikur Rahman, Md Nur Ahmed',
        competition: 'International Olympiad on Climate Change and Environmental Issues (IOCE 2025), Russia',
        level: 'Global',
        year: 2025,
      },
      {
        title: 'Paper of the Year',
        recipients: 'Jawad Zaman',
        competition: 'Northeast Regional Honors Conference 2025 \u2014 AI-driven machine translation research',
        level: 'Global',
        year: 2025,
      },
      {
        title: 'Bangladesh Representative',
        recipients: 'Anas Bin Azam',
        competition: 'World Robot Olympiad 2025, Philippines \u2014 160 teams from 25 nations',
        level: 'Global',
        year: 2025,
      },
      {
        title: 'Gold Medal & National Team Selection',
        recipients: 'ACCRC Sub-Executive',
        competition: 'World Robot Olympiad National Round and International Finals, Turkey',
        level: 'Global',
        year: 2025,
      },
      {
        title: 'Champion \u2014 Project Presentation',
        recipients: 'Md. Juglul Karim and Shahria Ahmed Arafat',
        competition: 'MIE 1.0 Robolution, CUET',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Champion \u2014 Project Display (Mechanical)',
        recipients: 'Md. Shafayet Biswas and Sabit Islam Efty',
        competition: '16th DRMC National Science Carnival 2025',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Champion \u2014 Research Article Contest',
        recipients: 'Masroor Ali Neil',
        competition: 'Innoverse National Science & Technology Carnival 2025, BUET',
        level: 'National',
        year: 2025,
      },
      {
        title: '1st Place \u2014 Robo Display',
        recipients: 'Md. Shafayet Biswas',
        competition: 'Technovation 2025, Josephite IT Club',
        level: 'National',
        year: 2025,
      },
      {
        title: '3rd Place / Special Award',
        recipients: 'Md. Shafayet Biswas',
        competition: '46th National Science & Technology Week',
        level: 'National',
        year: 2025,
      },
      {
        title: '1st Runner-Up \u2014 Project Display',
        recipients: 'Shahria Ahmed Arafat and Md. Juglul Karim',
        competition: 'Rajuk National Scipark 3.0',
        level: 'National',
        year: 2025,
      },
      {
        title: '11th Place \u2014 Divisional Round',
        recipients: 'Taufiq Mustafizur Rahman',
        competition: 'Bangladesh Physics Olympiad (BDPhO)',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Champion \u2014 Robotics Project',
        recipients: 'Sayeed Un Nur Shoaib and Arafat Zaman Sajid',
        competition: 'Shahid Bir Uttam Lt. Anwar\u2019s Girls College Mega Science Festival',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Champion \u2014 Extempore Speech',
        recipients: 'Muhammad Andalib',
        competition: 'Shahid Bir Uttam Lt. Anwar\u2019s Girls College Mega Science Festival',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Runner-Up \u2014 Wall Magazine',
        recipients: 'Ta-Sin Mahmud and Hafsa Islam Ohi',
        competition: 'Shahid Bir Uttam Lt. Anwar\u2019s Girls College Mega Science Festival',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Champion \u2014 Wall Magazine',
        recipients: 'The Renaissance \u2014 Zahinur Rahman, DM Abrar Mead, Sabrina Mustari',
        competition: 'BAF Shaheen 6th Language Summit',
        level: 'National',
        year: 2025,
      },
      {
        title: '2nd Runner-Up \u2014 Wall Magazine',
        recipients: 'Revolution of Fantasy',
        competition: 'BAF Shaheen 6th Language Summit',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Lieutenant Commissioning',
        recipients: 'Tannur Jubaer Swachya (Batch 52)',
        competition: 'Bangladesh Military Academy',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Green Card \u2014 95th BMA Long Course',
        recipients: 'Faisal Ahmed Adit',
        competition: 'Bangladesh Military Academy',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Green Card \u2014 93rd BMA Long Course',
        recipients: 'Md. Zahinur Rahman',
        competition: 'Bangladesh Military Academy',
        level: 'National',
        year: 2025,
      },
      {
        title: 'ISSB Qualification',
        recipients: 'DM Abrar Mead',
        competition: 'Inter Services Selection Board (ISSB)',
        level: 'National',
        year: 2025,
      },
      {
        title: 'Institutional Recognition',
        recipients: 'ACCRC members',
        competition: 'Humanoid Robot and Nano-Satellite projects \u2014 recognised by the College Principal',
        level: 'National',
        year: 2025,
      },
    ],
    executive_panel: [
      {
        name: 'Sayeed Un Nur Shoaib',
        designation: "President'25",
        imageUrl: '/leadership/committee-25/sayeed-un-nur-shoaib.webp',
        imageFrame: 'square',
      },
      {
        name: 'Mirza Tamzid Hasan',
        designation: "General Secretary'25",
        imageUrl: '/leadership/committee-25/mirza-tamzid-hasan.webp',
        imageFrame: 'square',
      },
      {
        name: 'Halima Tus Shadia',
        designation: "Administrative Secretary'25",
        imageUrl: '/leadership/committee-25/halima-tus-shadia.webp',
        imageFrame: 'square',
      },
      {
        name: 'Mohine Rana Soria',
        designation: "VP of Publications'25",
        imageUrl: '/leadership/committee-25/mohine-rana-soria.webp',
        imageFrame: 'square',
      },
    ],
  },
  '2024': {
    label: "Advisor Panel '24",
    eyebrow: 'LEADERSHIP ARCHIVE',
    description: '',
    achievements: [
      {
        title: 'National Finalist',
        recipients: 'Abrar Galib and Danesh Rafin',
        competition: 'Bangladesh Stockholm Junior Water Prize 2023',
        level: 'National',
        year: 2023,
      },
      {
        title: 'Silver Award',
        recipients: 'Abrar Galib Ohe',
        competition: "The Queen's Commonwealth Essay Competition 2023",
        level: 'Global',
        year: 2023,
      },
      {
        title: 'Sole Delegate from Bangladesh',
        recipients: 'Fatematuj Johra Rani',
        competition: 'International Human Rights Program',
        level: 'Global',
        year: 2023,
      },
    ],
    executive_panel: [
      {
        name: 'DM Abrar Mead',
        designation: "President'24",
        imageUrl: '/leadership/committee-24/dm-abrar-mead.webp',
        imageFrame: 'square',
      },
      {
        name: 'Sabrina Mustari',
        designation: "Organizing Secretary'24",
        imageUrl: '/leadership/committee-24/sabrina-mustari.webp',
        imageFrame: 'square',
      },
    ],
  },
  '2023': {
    label: 'Achievements Archive 2023',
    eyebrow: 'RECOGNITION ARCHIVE',
    description: 'Awards and recognition recorded during the 2023 season.',
    achievements: [],
    executive_panel: [],
  },
  founder: {
    label: 'Founder Panel',
    eyebrow: 'OUR BEGINNING',
    description: 'The founding team that established the club\u2019s culture of building, learning, and competing together.',
    achievements: [],
    executive_panel: [
      {
        name: 'Muedul Hasan Methun',
        designation: 'Founder & President',
        imageUrl: '/leadership/muedul-hasan-methun.webp',
        imageFrame: 'portrait',
      },
      {
        name: 'Ahmad Zaim Khan',
        designation: 'Co-Founder & General Secretary',
        imageUrl: '/leadership/ahmad-zaim-khan.webp',
        imageFrame: 'portrait',
      },
      {
        name: 'Shibil Rahman',
        designation: 'Co-Founder & Vice President (Admin)',
        imageUrl: '/leadership/shibil-rahman.webp',
        imageFrame: 'portrait',
      },
    ],
  },
};

const allAchievements = Object.values(panels).flatMap((panel) => panel.achievements);

/* Newest first. Listed explicitly because JavaScript always iterates
   number-like object keys ('2023'…'2026') in ascending order, which put the
   oldest panel at the top. The founding team (2019) comes last. */
const PANEL_ORDER: PanelKey[] = ['2026', '2025', '2024', '2023', 'founder'];

const leadershipPanels = PANEL_ORDER.map((key) => [key, panels[key]] as [PanelKey, PanelData])
  .filter(([, panel]) => panel.executive_panel.length > 0 || panel.moderators?.length);

/** Achievements shown before "Show more", and how many each click adds. */
const ACHIEVEMENTS_PAGE = 6;

export function AchievementsAndPanels() {
  const [adminAchievements, setAdminAchievements] = useState<FirestoreAchievement[]>([]);

  useEffect(() => {
    return subscribeToAchievements(setAdminAchievements, (error) => {
      // Historical achievements remain available if the live content service is unavailable.
      console.error('Unable to load live achievements.', error);
    });
  }, []);

  const achievements = useMemo(() => {
    return [...allAchievements, ...adminAchievements]
      .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }, [adminAchievements]);

  return (
    <section className={styles.section} id="achievements" aria-labelledby="achievements-title">
      {/* Depth layers: drifting glow orbs and an outlined wordmark behind the content */}
      <div className={styles.backdrop} aria-hidden>
        <Parallax speed={16} className={styles.orbA}><span /></Parallax>
        <Parallax speed={28} className={styles.orbB}><span /></Parallax>
        <p className={styles.wordmark}>Hall of Fame</p>
      </div>

      <div className={styles.wrap}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>Recognition / Leadership</p>
            <SplitReveal
              delay={0.1}
              className="font-display"
              lineClassName="text-white"
              lines={[
                <>Achievements &amp;</>,
                <><span className={styles.introSpan}>Executive Panels.</span></>,
              ]}
            />
            <h2 id="achievements-title" className="sr-only">Achievements &amp; Executive Panels.</h2>
          </div>
          <RiseIn stagger={false}>
            <p className={styles.introCopy}>
              A growing record of the people, projects, and results that represent ACCRC.
            </p>
          </RiseIn>
        </div>

        <div className={styles.panel}>
          <RiseIn stagger={false} className={styles.contentHeading}>
            <div>
              <Trophy aria-hidden="true" />
              <h4>All Achievements</h4>
            </div>
            <span className={styles.countBadge}>{achievements.length} published</span>
          </RiseIn>

          {achievements.length === 0
            ? <EmptyState label="achievement records" />
            : <AchievementList achievements={achievements} />}

          <LeadershipArchive />
        </div>
      </div>
    </section>
  );
}

/* The roll of leadership panels never changes after load. Memoised so that
   paging through achievements doesn't re-render ~60 member cards. */
const LeadershipArchive = memo(function LeadershipArchive() {
  return (
    <div className={styles.leadershipArchive} aria-label="Leadership archive">
      {leadershipPanels.map(([key, panel]) => (
        /* Panels are far too tall to move as one block, so the panel
           itself stays put and its parts — heading, sub-headings, each
           person — rise in as they reach the viewport. */
        <section key={key} className={`cv-auto ${styles.leadershipPanel}`} aria-labelledby={`leadership-${key}`}>
          <RiseIn stagger={false} className={styles.panelIntro}>
            <div>
              <p className={styles.eyebrow}>{panel.eyebrow}</p>
              <h3 id={`leadership-${key}`}>{panel.label}</h3>
            </div>
            {panel.description && <p>{panel.description}</p>}
          </RiseIn>

          {panel.moderators && panel.moderators.length > 0 && (
            <>
              <PanelHeading
                icon={<GraduationCap aria-hidden="true" />}
                title="Advisor & Moderation Panel"
                count={`${panel.moderators.length} members`}
              />
              <MemberGrid members={panel.moderators} className={styles.moderatorGrid} />
            </>
          )}

          {panel.executive_panel.length > 0 && (
            <>
              <PanelHeading
                icon={<UsersRound aria-hidden="true" />}
                title={key === 'founder' ? 'Founding Team' : 'Executive Panel'}
                count={`${panel.executive_panel.length} members`}
              />
              <MemberGrid members={panel.executive_panel} className={key === 'founder' ? styles.founderGrid : undefined} />
            </>
          )}
        </section>
      ))}
    </div>
  );
});

/* Owns the filter and "Show more" state, so changing either re-renders only
   the achievement list. */
function AchievementList({ achievements }: { achievements: Array<Achievement | FirestoreAchievement> }) {
  const [levelFilter, setLevelFilter] = useState<'All' | AwardLevel>('All');
  const [shown, setShown] = useState(ACHIEVEMENTS_PAGE);

  const filtered = useMemo(
    () => (levelFilter === 'All' ? achievements : achievements.filter((a) => a.level === levelFilter)),
    [achievements, levelFilter],
  );

  /* Only the first `shown` records, grouped newest-first by year. */
  const achievementYears = useMemo(() => {
    const groups = new Map<number, Array<Achievement | FirestoreAchievement>>();
    for (const item of filtered.slice(0, shown)) {
      const list = groups.get(item.year) ?? [];
      list.push(item);
      groups.set(item.year, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered, shown]);

  return (
    <AchievementArchive
      years={achievementYears}
      total={filtered.length}
      shown={Math.min(shown, filtered.length)}
      filter={levelFilter}
      onFilter={(value) => {
        setLevelFilter(value);
        setShown(ACHIEVEMENTS_PAGE);
      }}
      /* Low priority, so the tap responds at once and the new cards render
         right after instead of blocking the press. */
      onMore={() => startTransition(() => setShown((n) => n + ACHIEVEMENTS_PAGE))}
      onLess={() => setShown(ACHIEVEMENTS_PAGE)}
    />
  );
}

function PanelHeading({ icon, title, count }: { icon: ReactNode; title: string; count: string }) {
  return (
    <RiseIn stagger={false} distance={24} className={`${styles.contentHeading} ${styles.executiveHeading}`}>
      <div>{icon}<h4>{title}</h4></div>
      <span>{count}</span>
    </RiseIn>
  );
}

/* Achievements grouped by year. The year label pins to the left while its
   records scroll past, so the archive reads as a ledger rather than a wall of
   identical cards. Only a page of records is shown at first. */
function AchievementArchive({
  years,
  total,
  shown,
  filter,
  onFilter,
  onMore,
  onLess,
}: {
  years: Array<[number, Array<Achievement | FirestoreAchievement>]>;
  total: number;
  shown: number;
  filter: 'All' | AwardLevel;
  onFilter: (value: 'All' | AwardLevel) => void;
  onMore: () => void;
  onLess: () => void;
}) {
  const options: Array<'All' | AwardLevel> = ['All', 'Global', 'National'];
  const topRef = useRef<HTMLDivElement>(null);
  const remaining = total - shown;

  const collapse = () => {
    onLess();
    // Bring the reader back to the top of the list they just shortened.
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <>
      <div ref={topRef} className={styles.filterRow}>
        <div className={styles.filters} role="group" aria-label="Filter achievements by recognition level">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilter(option)}
              aria-pressed={filter === option}
              className={`${styles.filterChip} ${filter === option ? styles.filterChipActive : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className={styles.filterNote} aria-live="polite">
          Showing {shown} of {total}
        </p>
      </div>

      {years.map(([year, items]) => (
        <section className={styles.yearSection} key={`${filter}-${year}`} aria-label={`${year} achievements`}>
          <div className={styles.yearSticky}>
            <RiseIn stagger={false} distance={24} className={styles.yearLabel}>
              <span className={styles.yearNumber} aria-hidden>{year}</span>
              <span className={styles.yearCount}>
                {items.length} {items.length === 1 ? 'record' : 'records'}
              </span>
            </RiseIn>
          </div>
          <div className={styles.yearGrid}>
            {items.map((achievement, index) => (
              <AchievementCard
                key={`${'id' in achievement ? achievement.id : 'built-in'}-${achievement.title}`}
                achievement={achievement}
                trophy={index % 2 === 0}
              />
            ))}
          </div>
        </section>
      ))}

      {total > ACHIEVEMENTS_PAGE && (
        <div className={styles.moreRow}>
          {remaining > 0 ? (
            <button type="button" className={styles.moreButton} onClick={onMore}>
              Show more
              <span className={styles.moreCount}>+{Math.min(remaining, ACHIEVEMENTS_PAGE)}</span>
              <ChevronDown aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className={`${styles.moreButton} ${styles.lessButton}`} onClick={collapse}>
              Show less
              <ChevronDown aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

const AchievementCard = memo(function AchievementCard({
  achievement,
  trophy,
}: {
  achievement: Achievement | FirestoreAchievement;
  trophy: boolean;
}) {
  return (
    <RiseIn>
      <TiltCard className={styles.cardWrap} maxTilt={4}>
        <article className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.awardIcon} aria-hidden="true">
              {trophy ? <Trophy /> : <Medal />}
            </span>
            <div className={styles.cardMeta}>
              <span className={achievement.level === 'Global' ? styles.global : styles.national}>
                {achievement.level}
              </span>
              <time dateTime={String(achievement.year)}>{achievement.year}</time>
            </div>
          </div>
          <h5 className={styles.cardTitle}>{achievement.title}</h5>
          <p className={styles.recipients}>{achievement.recipients}</p>
          <p className={styles.competition}>{achievement.competition}</p>
        </article>
      </TiltCard>
    </RiseIn>
  );
});

function MemberGrid({ members, className = '' }: { members: ExecutiveMember[]; className?: string }) {
  return (
    <div className={`${styles.memberGrid} ${className}`}>
      {members.map((member) => {
        const imageClass = member.imageFrame === 'portrait'
          ? styles.portraitFrame
          : member.imageFrame === 'wide'
            ? styles.wideFrame
            : member.imageFrame === 'square'
              ? styles.squareFrame
              : '';

        return (
          /* Each person rises in as their row reaches the viewport, cascading
             across the row, while the photo settles from a slight zoom. */
          <RiseIn
            key={member.name}
            as="article"
            className={`${styles.memberCard} h-full`}
            aria-label={`${member.name}, ${member.designation}`}
          >
            <div className={styles.portrait}>
              <div data-rise-zoom>
                {member.imageUrl ? (
                  <img
                    className={`${styles.avatar} ${imageClass}`}
                    src={member.imageUrl}
                    alt={`${member.name}, ${member.designation}`}
                    width={768}
                    height={768}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={styles.avatarFallback} aria-label={`Photo to be added for ${member.name}`}>
                    {member.name.split(' ').map((part) => part[0]).join('').slice(0, 3)}
                  </div>
                )}
              </div>
              <span className={styles.portraitShine} aria-hidden="true" />
            </div>
            <div className={styles.memberInfo}>
              <p className={styles.memberRole}>{member.designation}</p>
              <h5>{member.name}</h5>
              {member.collegeId && (
                <p className={styles.memberId}><IdCard size={14} aria-hidden="true" /> College ID: {member.collegeId}</p>
              )}
            </div>
          </RiseIn>
        );
      })}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className={styles.emptyState}>
      <Award aria-hidden="true" />
      <p>No {label} published yet.</p>
    </div>
  );
}
