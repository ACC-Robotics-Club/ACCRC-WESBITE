'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, GraduationCap, IdCard, Medal, ShieldCheck, Trophy, UsersRound } from 'lucide-react';
import { subscribeToAchievements, type FirestoreAchievement } from '@/lib/firestore';
import { SplitReveal } from '@/components/fx/SplitReveal';
import { Parallax } from '@/components/fx/Parallax';
import { TiltCard } from '@/components/fx/TiltCard';
import { ScrollSlide } from '@/components/fx/ScrollSlide';
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
  prefects?: ExecutiveMember[];
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
        imageUrl: '/leadership/committee-26/photo_6170079490235634212_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Md. Shafayet Biswas',
        designation: 'General Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634213_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Fatema Tooz-Zohra Falguni',
        designation: 'Assistant General Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634214_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Md. Farhad Hossain',
        designation: 'Organizing Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634215_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Waqil Chowdhury Jim',
        designation: 'Administrative Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634216_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Aisha Tabassum Probha',
        designation: 'Joint Secretary',
        imageUrl: '/leadership/committee-26/photo_6170079490235634217_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Mahdi Al Rayan Bhuiyan',
        designation: 'Head of Event Management',
        imageUrl: '/leadership/committee-26/photo_6170079490235634218_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Shahria Ahmed Arafat',
        designation: 'Vice President (Project)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634219_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Nusrat Jahan',
        designation: 'Vice President (IT)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634220_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Ayman Ibna Amir',
        designation: 'Vice President (Creative Works)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634221_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Mst. Sraboni Akter Mimi',
        designation: 'Vice President (Publication)',
        imageUrl: '/leadership/committee-26/photo_6170079490235634222_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Azim Saikat Hassan Sagor',
        designation: 'Secretary of IT',
        imageUrl: '/leadership/committee-26/photo_6170079490235634223_y.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Mukaddim Rahman',
        designation: 'Secretary of Creative Works',
        imageUrl: '/leadership/committee-26/photo_6170079490235634224_y.jpg',
        imageFrame: 'square',
      },
    ],
    moderators: [
      {
        name: 'Naimul Haque Naim',
        designation: 'Moderator',
        imageUrl: '/leadership/moderator-naimul-haque-naim.png',
        imageFrame: 'wide',
      },
      {
        name: 'Prof. Md. Abdul Halim',
        designation: 'Co-Moderator',
        imageUrl: '/leadership/moderator-md-abdul-halim.jpg',
        imageFrame: 'portrait',
      },
    ],
    prefects: [
      {
        name: 'Md. Shafayet Biswas',
        designation: 'Central Club Prefect \u2014 2026 Batch',
        imageUrl: '/images/panel/prefect-2026/centralclubprefect.png',
        imageFrame: 'square',
      },
      {
        name: 'Fatema-Tooz-Zohra Falguni',
        designation: 'AST Central Club Prefect \u2014 2026 Batch',
        imageUrl: '/images/panel/prefect-2026/astprefectbatch26.png',
        imageFrame: 'square',
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
        imageUrl: '/leadership/committee-25/sayeed-un-nur-shoaib.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Mirza Tamzid Hasan',
        designation: "General Secretary'25",
        imageUrl: '/leadership/committee-25/mirza-tamzid-hasan.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Halima Tus Shadia',
        designation: "Administrative Secretary'25",
        imageUrl: '/leadership/committee-25/halima-tus-shadia.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Mohine Rana Soria',
        designation: "VP of Publications'25",
        imageUrl: '/leadership/committee-25/mohine-rana-soria.jpg',
        imageFrame: 'square',
      },
    ],
  },
  '2024': {
    label: "Executive Committee '24",
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
        imageUrl: '/leadership/committee-24/dm-abrar-mead.jpg',
        imageFrame: 'square',
      },
      {
        name: 'Sabrina Mustari',
        designation: "Organizing Secretary'24",
        imageUrl: '/leadership/committee-24/sabrina-mustari.jpg',
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
        imageUrl: '/leadership/muedul-hasan-methun.png',
        imageFrame: 'portrait',
      },
      {
        name: 'Ahmad Zaim Khan',
        designation: 'Co-Founder & General Secretary',
        imageUrl: '/leadership/ahmad-zaim-khan.png',
        imageFrame: 'portrait',
      },
      {
        name: 'Shibil Rahman',
        designation: 'Co-Founder & Vice President (Admin)',
        imageUrl: '/leadership/shibil-rahman.png',
        imageFrame: 'portrait',
      },
    ],
  },
};

const allAchievements = Object.values(panels).flatMap((panel) => panel.achievements);

/* Newest committee first, founders last. (Object.entries would list the
   year keys oldest-first, since integer-like keys sort ascending.) */
const leadershipPanels = (Object.entries(panels) as Array<[PanelKey, PanelData]>)
  .filter(([, panel]) => panel.executive_panel.length > 0 || panel.moderators?.length || panel.prefects?.length)
  .sort(([a], [b]) => (a === 'founder' ? 1 : b === 'founder' ? -1 : Number(b) - Number(a)));

/* Home page: the achievements ledger. The leadership panels live on their own
   page (/panels/) and are linked from here and from the navbar. */
export function Achievements() {
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

  const [levelFilter, setLevelFilter] = useState<'All' | AwardLevel>('All');

  /* Grouped newest-first by the year stored on each record. */
  const achievementYears = useMemo(() => {
    const visible = levelFilter === 'All'
      ? achievements
      : achievements.filter((a) => a.level === levelFilter);
    const groups = new Map<number, Array<Achievement | FirestoreAchievement>>();
    for (const item of visible) {
      const list = groups.get(item.year) ?? [];
      list.push(item);
      groups.set(item.year, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [achievements, levelFilter]);

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
            <p className={styles.eyebrow}>Recognition / Results</p>
            <SplitReveal
              delay={0.1}
              className="font-display"
              lineClassName="text-white"
              lines={[
                <>Hall of</>,
                <><span className={styles.introSpan}>Achievements.</span></>,
              ]}
            />
            <h2 id="achievements-title" className="sr-only">Hall of Achievements.</h2>
          </div>
          <div>
            <p className={styles.introCopy}>
              A growing record of the projects and results that represent ACCRC.
            </p>
            <a href="/panels/" className={styles.panelsLink}>
              Meet the executive panels <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.contentHeading}>
            <div>
              <Trophy aria-hidden="true" />
              <h4>All Achievements</h4>
            </div>
            <span className={styles.countBadge}>{achievements.length} published</span>
          </div>

          {achievements.length === 0
            ? <EmptyState label="achievement records" />
            : <AchievementArchive years={achievementYears} filter={levelFilter} onFilter={setLevelFilter} />}
        </div>
      </div>
    </section>
  );
}

/* The /panels/ page: every committee, newest first. */
export function LeadershipPanels() {
  return (
    <section className={`${styles.section} ${styles.pageSection}`} aria-labelledby="panels-title">
      <div className={styles.backdrop} aria-hidden>
        <Parallax speed={16} className={styles.orbA}><span /></Parallax>
        <Parallax speed={28} className={styles.orbB}><span /></Parallax>
        <p className={styles.wordmark}>Leadership</p>
      </div>

      <div className={styles.wrap}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>Leadership / Archive</p>
            <SplitReveal
              delay={0.1}
              className="font-display"
              lineClassName="text-white"
              lines={[
                <>Executive</>,
                <><span className={styles.introSpan}>Panels.</span></>,
              ]}
            />
            <h1 id="panels-title" className="sr-only">Executive Panels</h1>
          </div>
          <p className={styles.introCopy}>
            The people who have led ACCRC, from the founding team to the current committee.
          </p>
        </div>

        <div className={styles.panel}>
          <div className={`${styles.leadershipArchive} ${styles.leadershipArchiveFirst}`} aria-label="Leadership archive">
            {leadershipPanels.map(([key, panel], panelIndex) => (
              /* These panels run from ~570px to ~2800px tall. A top-anchored
                 range would finish the slide within the first screen and leave
                 the rest of the panel static, so the range is anchored to the
                 panel's end and the travel spans its whole height. */
              <ScrollSlide
                key={key}
                axis="y"
                from={170 + (panelIndex % 2) * 45}
                to={-16}
                offset={['start 0.9', 'end 0.72']}
              >
              <section className={styles.leadershipPanel} aria-labelledby={`leadership-${key}`}>
                <div className={styles.panelIntro}>
                  <div>
                    <p className={styles.eyebrow}>{panel.eyebrow}</p>
                    <h3 id={`leadership-${key}`}>{panel.label}</h3>
                  </div>
                  {panel.description && <p>{panel.description}</p>}
                </div>

                {panel.moderators && panel.moderators.length > 0 && (
                  <>
                    <div className={`${styles.contentHeading} ${styles.executiveHeading}`}>
                      <div><GraduationCap aria-hidden="true" /><h4>Advisor &amp; Moderation Panel</h4></div>
                      <span>{panel.moderators.length} members</span>
                    </div>
                    <MemberGrid members={panel.moderators} className={styles.moderatorGrid} />
                  </>
                )}

                {panel.executive_panel.length > 0 && (
                  <>
                    <div className={`${styles.contentHeading} ${styles.executiveHeading}`}>
                      <div><UsersRound aria-hidden="true" /><h4>{key === 'founder' ? 'Founding Team' : 'Executive Panel'}</h4></div>
                      <span>{panel.executive_panel.length} members</span>
                    </div>
                    <MemberGrid members={panel.executive_panel} className={key === 'founder' ? styles.founderGrid : undefined} />
                  </>
                )}

                {panel.prefects && panel.prefects.length > 0 && (
                  <>
                    <div className={`${styles.contentHeading} ${styles.executiveHeading}`}>
                      <div><ShieldCheck aria-hidden="true" /><h4>2026 Batch Prefects</h4></div>
                      <span>{panel.prefects.length} prefects</span>
                    </div>
                    <MemberGrid members={panel.prefects} className={styles.prefectGrid} />
                  </>
                )}
              </section>
              </ScrollSlide>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Achievements grouped by year. The year label pins to the left while its
   records scroll past, so the archive reads as a ledger rather than a wall of
   identical cards. */
function AchievementArchive({
  years,
  filter,
  onFilter,
}: {
  years: Array<[number, Array<Achievement | FirestoreAchievement>]>;
  filter: 'All' | AwardLevel;
  onFilter: (value: 'All' | AwardLevel) => void;
}) {
  const options: Array<'All' | AwardLevel> = ['All', 'Global', 'National'];

  return (
    <>
      <div className={styles.filterRow}>
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
        <p className={styles.filterNote}>
          {years.reduce((total, [, items]) => total + items.length, 0)} records
        </p>
      </div>

      {years.map(([year, items], bandIndex) => {
        const fromLeft = bandIndex % 2 === 0;
        return (
          <section className={styles.yearSection} key={year} aria-label={`${year} achievements`}>
            {/* The year label drifts across as the band scrolls past. */}
            <div className={styles.yearSticky}>
              <ScrollSlide axis="y" from={120 + bandIndex * 30} to={-14}>
                <span className={styles.yearNumber} aria-hidden>{year}</span>
                <span className={styles.yearCount}>
                  {items.length} {items.length === 1 ? 'record' : 'records'}
                </span>
              </ScrollSlide>
            </div>
            {/* The cards for that year slide in from the opposite side. */}
            <ScrollSlide axis="y" from={180} to={-16}>
              <div className={styles.yearGrid}>
                {items.map((achievement, index) => (
                  <ScrollSlide
                    key={`${'id' in achievement ? achievement.id : 'built-in'}-${achievement.title}`}
                    axis="y"
                    from={150 + (index % 3) * 45}
                    to={-16}
                  >
                    <TiltCard className={styles.cardWrap} maxTilt={4}>
                      <article className={styles.card}>
                        <div className={styles.cardTop}>
                          <span className={styles.awardIcon} aria-hidden="true">
                            {index % 2 === 0 ? <Trophy /> : <Medal />}
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
                  </ScrollSlide>
                ))}
              </div>
            </ScrollSlide>
          </section>
        );
      })}
    </>
  );
}

function MemberGrid({ members, className = '' }: { members: ExecutiveMember[]; className?: string }) {
  return (
    <div className={`${styles.memberGrid} ${className}`}>
      {members.map((member, index) => {
        const imageClass = member.imageFrame === 'portrait'
          ? styles.portraitFrame
          : member.imageFrame === 'wide'
            ? styles.wideFrame
            : member.imageFrame === 'square'
              ? styles.squareFrame
              : '';

        return (
          /* Each person rises as they come into view, so the panel reads as a
             roll call rather than a wall of static cards. Member cards are
             small, so the default top-anchored range is exactly right here. */
          <ScrollSlide
            key={member.name}
            axis="y"
            from={120 + (index % 4) * 40}
            to={-14}
          >
          <article
            className={`${styles.memberCard} h-full`}
            aria-label={`${member.name}, ${member.designation}`}
          >
            <div className={styles.portrait}>
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
              <span className={styles.portraitShine} aria-hidden="true" />
            </div>
            <div className={styles.memberInfo}>
              <p className={styles.memberRole}>{member.designation}</p>
              <h5>{member.name}</h5>
              {member.collegeId && (
                <p className={styles.memberId}><IdCard size={14} aria-hidden="true" /> College ID: {member.collegeId}</p>
              )}
            </div>
          </article>
          </ScrollSlide>
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
