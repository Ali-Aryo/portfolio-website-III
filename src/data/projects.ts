import sabaImage from '@/assets/sabalandingpage.png'
import steadyscriptImage from '@/assets/steadyscript.png'
import portfolio2Image from '@/assets/websiteportfolio2.png'
import portfolioImage from '@/assets/websiteportfolio.png'
import paddlepalImage from '@/assets/paddlepal.jpeg'
import phishnetLogoImage from '@/assets/phishnet-logo.jpg'
import mindfulMemoriesCoverImage from '@/assets/mindful memories logo_edited.avif'
import paddlepalSessionImage from '@/assets/paddlepal-session-detail.jpg'
import paddlepalSigninImage from '@/assets/paddlepal-signin.jpg'
import paddlepalLiveZoneImage from '@/assets/paddlepal-live-zone.jpg'
import paddlepalLandingImage from '@/assets/paddlepal-landing-hero.jpg'
import clearcallCoverImage from '@/assets/clearcall-cover.jpg'
import clearcallReportPdf from '@/assets/ClearCall-Report.pdf'
import clearcallDemoPdf from '@/assets/ClearCall-Demo-Slides.pdf'
import geometryDashCoverImage from '@/assets/geometry-dash-cover.jpg'
import geometryDashReportPdf from '@/assets/GeometryDash-Report.pdf'
import geometryDashDemoPdf from '@/assets/GeometryDash-Demo-Slides.pdf'
import therassistCoverImage from '@/assets/therassist-cover.jpg'
import phishnetGalleryImage from '@/assets/Phishnet-gallery-1.png'
import geometryDashGallery1Image from '@/assets/geometrydash-gallery-1.jpg'
import geometryDashGallery2Image from '@/assets/geometrydash-gallery-2.jpg'
import steadyscriptGallery1Image from '@/assets/steadyscript-gallery-1.png'
import steadyscriptGallery2Image from '@/assets/steadyscript-gallery-2.jpg'
import lookerCliCoverImage from '@/assets/looker-cli-cover.jpg'
import backupPipelineCoverImage from '@/assets/backup-pipeline-cover.jpg'

/**
 * The filter chips are generated from this list, in this order — see
 * `usedTags()` below. Adding a tag here alone does nothing; a chip only
 * appears once at least one project actually carries the tag.
 */
export const PROJECT_TAGS = [
    'Co-op',
    'Deployed',
    'AI/ML',
    'Hackathon',
    'Website',
    'Web App',
    'Mobile',
    'Hardware',
    'University',
] as const

export type ProjectTag = (typeof PROJECT_TAGS)[number]

export interface ProjectLink {
    label: string
    href: string
}

export interface ProjectImage {
    src: string
    /* Describe what the shot shows, not that it is a screenshot — this is read
       aloud in place of the image. */
    alt: string
}

export interface Project {
    /** Stable id. Doubles as the URL hash for deep links, so avoid renaming. */
    slug: string
    title: string
    /** One or two lines on the card face. Keep it short — the grid is dense. */
    summary: string
    /**
     * Who or what the project was for — the answer to "why does this exist".
     * Free text, so it covers all the shapes this takes: a client or company
     * name ('Saba Management Consulting'), or the occasion when there is no
     * client ('Personal', 'Hackathon', 'School'). Rendered as a subtitle under
     * the title on both the card and the detail view, and omitted entirely when
     * absent rather than leaving a gap.
     */
    context?: string
    tags: ProjectTag[]
    cover: string
    coverAlt: string
    /* Everything below is optional and drives the detail view. Any field left
       empty is skipped entirely rather than rendering a bare heading, so a
       half-filled project still looks deliberate. */
    overview?: string
    highlights?: string[]
    tech?: string[]
    gallery?: ProjectImage[]
    links?: ProjectLink[]
}

/**
 * TODO (Ali): `context` is filled in only where you have confirmed it; five
 * projects carry a marker instead. `overview`, `highlights`, `tech`, `gallery`
 * and `links` are likewise only
 * filled in for `website-portfolio` below, which is here as a worked example of
 * the full detail layout. The rest carry their original card copy and need real
 * write-ups — the detail view hides whatever is missing, so it degrades quietly
 * until you get to them.
 */
export const projects: Project[] = [
    {
        slug: 'paddlepal',
        title: 'PaddlePal',
        context: 'Capstone - SFU',
        summary:
            'A smart pickleball paddle with embedded force sensors, paired over Bluetooth with a companion iOS app that tracks shot zone, power, and shot type in real time.',
        tags: ['Hardware', 'Mobile', 'Website', 'University'],
        cover: paddlepalImage,
        coverAlt: 'The PaddlePal smart pickleball paddle, wrapped in blue with its embedded sensor board',
        overview:
            "PaddlePal is a capstone project spanning custom hardware, a native mobile app, and a marketing site. A 4-zone force-sensor array and IMU inside the paddle handle stream data over BLE to \u201cPaddlePal Connect,\u201d a React Native / Expo app that records sessions, classifies shot type (drive, drop, dink, overhead, rally), and stores history in Cloud Firestore. The firmware runs a dual-core Arduino Mbed OS build \u2014 one core polling the force sensors, the other handling BLE and the IMU \u2014 with a hardware watchdog that auto-recovers from stalls in the field. Graded A.",
        highlights: [
            'Dual-core Arduino Nano RP2040 firmware: Core 1 polls 4 force-sensitive-resistor zones with hysteresis + peak-hold dedup so one physical hit sends exactly one BLE packet; Core 0 runs BLE, the IMU, and a startup buzz.',
            'A hardware watchdog auto-reboots the paddle in ~4 seconds if either core stalls \u2014 shipped as the resilience layer after a hard-to-pin-down I2C lockup during hardware debugging.',
            'On-device rule-based shot classifier (Overhead / Drive / Dink / Drop / Rally) runs from a trailing IMU window captured around each force hit \u2014 no ML model, no server round trip.',
            'Foreground BLE auto-connect and auto-reconnect: the app finds and reconnects to the paddle on its own after a drop, with a manual scanner kept as fallback.',
            'A seven-step in-context onboarding tour runs on the real dashboard/live/history screens (not a mock), gated on real BLE and Firestore actions rather than just taps.',
            'Session pipeline buffers hits in memory and flushes once to Firestore on session end, keeping each session comfortably within Firestore\u2019s 1MB document limit.',
        ],
        tech: [
            'Arduino Nano RP2040 Connect (Mbed OS core)',
            'React Native',
            'Expo (Router, dev client)',
            'Xcode',
            'TypeScript',
            'Firebase Authentication',
            'Cloud Firestore',
            'react-native-ble-plx',
            'React 19 + Vite (landing page)',
            'Tailwind CSS v4',
        ],
        gallery: [
            { src: paddlepalLandingImage, alt: 'The PaddlePal marketing site hero, showing the paddle and its sensors' },
            { src: paddlepalSigninImage, alt: 'The PaddlePal Connect app sign-in screen' },
            { src: paddlepalLiveZoneImage, alt: 'The Live tab showing real-time hit zones on the paddle diagram' },
            { src: paddlepalSessionImage, alt: 'A session detail screen with shots-per-zone and average power charts' },
        ],
        links: [
            { label: 'GitHub Org', href: 'https://github.com/PaddlePal' },
            { label: 'App Repo', href: 'https://github.com/PaddlePal/PaddlePal-App' },
            { label: 'Landing Page Repo', href: 'https://github.com/PaddlePal/PaddlePal-LandingPage-II' },
            { label: 'Live Site', href: 'https://paddlepalconnect.netlify.app/' },
        ],
    },
    {
        slug: 'saba-landing-page',
        title: 'Saba Consulting Landing Page',
        context: 'Saba Management Consulting',
        summary:
            'A dark, glassmorphic marketing site pitching SABA as the bridge between AI compute demand and infrastructure supply, with a Netlify-backed lead form.',
        tags: ['Website', 'Deployed'],
        cover: sabaImage,
        coverAlt: 'The SABA Management Consulting landing page hero, with a typing-effect headline on a dark background',
        overview:
            'A single-page site for SABA Management Consulting, an AI infrastructure consulting practice. The copy and layout are built around one framing \u2014 SABA as the bridge between AI-native compute demand and land/power/shell (LPS) infrastructure supply \u2014 addressed to three audiences in turn: AI-native teams needing GPU capacity, LPS owners needing qualified offtakers, and neo-clouds/capital partners needing de-risked deals. Built and shipped in a single day.',
        highlights: [
            'A typing-effect hero headline that cycles through positioning lines ("Execution for AI Cluster Deals.", "Sovereign AI Compute.", ...).',
            'A dark "Obsidian Architect" design system: a nocturnal palette anchored at #0A0E1A, glassmorphic cards, and a deliberate no-hard-border rule where section boundaries come from tonal shifts instead of lines.',
            'A three-column audience breakdown (AI Natives / Providers / Neo-Clouds & LPS) that carries the whole site\u2019s value proposition without a generic feature-list layout.',
            'A validated contact form (React Hook Form + Zod) wired to Netlify Forms with honeypot spam protection \u2014 no backend of its own.',
        ],
        tech: [
            'Next.js 15 (App Router)',
            'TypeScript',
            'Tailwind CSS v4',
            'React Hook Form',
            'Zod',
            'Lucide React',
            'Netlify (hosting + Forms)',
        ],
        links: [
            { label: 'Live Site', href: 'https://sabamanagementconsulting.com/' },
            { label: 'Code', href: 'https://github.com/Ali-Aryo/saba-landing-page' },
        ],
    },

    {
        slug: 'steadyscript',
        title: 'SteadyScript',
        context: 'nwHacks 2026',
        summary:
            'A biofeedback pen and webapp that tracks hand tremor in real time via computer vision, built for fine-motor therapy \u2014 won Best Beginner Project and Best Wellness-Related Hack.',
        tags: ['Hackathon', 'Hardware', 'Web App'],
        cover: steadyscriptImage,
        coverAlt: 'The SteadyScript landing page',
        overview:
            'SteadyScript targets fine-motor therapy for people with Parkinson\u2019s disease, stroke survivors, and people recovering from brain injuries. A colored marker on a pen is tracked by a webcam using computer vision; the system separates involuntary tremor from intentional hand movement and gives the user real-time visual and physical LED feedback on how steady their hand is, guiding them through a tremor baseline test and metronome-paced mobility exercises, then a session summary that tracks progress over time. Built in roughly 24 hours at nwHacks 2026.',
        highlights: [
            'A custom lateral jitter detection algorithm isolates involuntary wobble from intended pen movement \u2014 the team\u2019s core technical contribution, and the hard problem: naive tremor measurement penalizes normal motion.',
            'OpenCV HSV color segmentation tracks the pen marker at roughly 30 FPS, streamed from the browser to a FastAPI backend over WebSocket and rendered back as an MJPEG overlay with a live stability score.',
            'An Arduino Uno gives physical LED feedback (green for steady, red for jittering) driven over serial from the backend, enabling eyes-free training so the user isn\u2019t stuck watching a screen mid-exercise.',
            '🏆 Won Best Beginner Project and Best Wellness-Related Hack at nwHacks 2026.',
        ],
        tech: [
            'React + TypeScript',
            'Vite',
            'Tailwind CSS',
            'Framer Motion',
            'Recharts',
            'FastAPI (Python)',
            'OpenCV',
            'Arduino Uno + PySerial',
            'Docker Compose',
        ],
        gallery: [
            {
                src: steadyscriptGallery1Image,
                alt: 'The SteadyScript dashboard before a stability test, showing the pen-tracking camera feed alongside session performance and streak stats',
            },
            {
                src: steadyscriptGallery2Image,
                alt: 'A live hold-mode session tracking a green marker on the pen tip, with jitter stats reporting 93% stability',
            },
        ],
        links: [
            { label: 'Code', href: 'https://github.com/SteadyScript/SteadyScript' },
            { label: 'Devpost', href: 'https://devpost.com/software/steadyscript' },
            { label: 'Demo Video', href: 'https://www.youtube.com/watch?v=QCpoyvr15rE' },
        ],
    },
    {
        slug: 'looker-ops-cli',
        title: 'Looker Ops CLI',
        context: 'TELUS',
        summary:
            'An internal CLI tool built on the Looker SDK, automating reporting and per-client dashboard operations for the team.',
        tags: ['Co-op', 'Deployed'],
        cover: lookerCliCoverImage,
        coverAlt: 'A terminal running looker-cli commands beside a panel of client dashboard data',
        overview:
            'A Python CLI tool, built with Typer and the Looker SDK and authenticated via environment-based credentials, that replaced a set of repetitive manual reporting tasks with single commands. Beyond reporting, it grew into the team\u2019s general-purpose interface to the Looker instance: pulling data on any client, duplicating a client\u2019s dashboards into new folders, restoring dashboards from the Google Cloud Storage backups created by the companion Client Backup Pipeline, and listing out most other data the Looker SDK exposes.',
        highlights: [
            'Built with Typer for a discoverable, subcommand-based CLI (client fetch, dashboard copy, backup restore, and more) rather than a single flag-heavy script.',
            'Authenticates against the Looker API via environment variables, keeping credentials out of the codebase entirely.',
            'Per-client dashboard duplication \u2014 copying an existing dashboard set into a new folder for a new client \u2014 turned a manual, error-prone process into one command.',
            'Restores dashboards straight from the dated Google Cloud Storage backups produced by the Client Backup Pipeline, closing the loop between the two projects.',
            'Adopted by the team as the default way to interact with the Looker instance, cutting time spent on routine reporting tasks.',
        ],
        tech: [
            'Python',
            'Typer',
            'Looker SDK',
            'Google Cloud Storage',
            'Environment-based auth',
        ],
    },
    {
        slug: 'client-backup-pipeline',
        title: 'Client Backup Pipeline',
        context: 'TELUS',
        summary:
            'A scheduled Google Cloud Function that backs up every client\u2019s Looker dashboards daily, organized by client for easy restoration.',
        tags: ['Co-op', 'Deployed'],
        cover: backupPipelineCoverImage,
        coverAlt: 'A daily cron trigger flowing through a cloud function into a dated Cloud Storage bucket, organized by client',
        overview:
            'A Python script, deployed to Google Cloud Platform as a scheduled Cloud Function and provisioned entirely through Terraform, that backs up every client\u2019s Looker dashboards on a daily cron schedule. Each run creates a new date-stamped bucket in Google Cloud Storage and writes every client\u2019s dashboards into it organized by client, so any dashboard can be found and restored \u2014 via the companion Looker Ops CLI \u2014 without hunting through an undifferentiated backup dump.',
        highlights: [
            'Infrastructure defined as code with Terraform, so the Cloud Function, its schedule, and its permissions are reproducible rather than click-configured.',
            'Runs daily as a scheduled job with no manual trigger, ensuring backups happen consistently regardless of who is around.',
            'Creates a new date-stamped Cloud Storage bucket per run and organizes every backed-up dashboard by client inside it, so a specific client\u2019s data is easy to locate later.',
            'Built as the data-safety half of a pair with the Looker Ops CLI, which reads these same backups to restore a client\u2019s dashboards on demand.',
        ],
        tech: [
            'Python',
            'Looker SDK',
            'Google Cloud Platform (Cloud Functions)',
            'Terraform',
            'Google Cloud Storage',
        ],
    },
    {
        slug: 'website-portfolio-ii',
        title: 'Website Portfolio II',
        context: 'Personal',
        summary:
            'A heavier editorial pass on the personal site: a full-bleed video hero, a liquid-glass component system, and a scroll-linked timeline and skill carousel built for a fuller story than the card grid alone.',
        tags: ['Website', 'Deployed'],
        cover: portfolio2Image,
        coverAlt: 'The video hero section, with a pinned waterfall backdrop and the site nav overlaid in frosted glass',
        overview:
            'The editorial redesign of Ali\u2019s personal site \u2014 built from scratch rather than a template, with a single pinned full-bleed video background sitting behind the whole page so every section reads as frosted/liquid glass floating over one continuous scene instead of a stack of separately backgrounded blocks. Beyond the filterable project gallery, this pass also built out a scroll-linked Timeline section and a continuously scrolling skill carousel for a heavier, more narrative editorial layout \u2014 both fully built and kept in the codebase, ready to drop back into the page.',
        highlights: [
            'A reusable `liquid-glass` utility built from layered inset highlights, so panels read as a lit slab of glass rather than a flat tinted box.',
            'A full-bleed video hero that falls back to a poster frame and pauses itself under `prefers-reduced-motion`.',
            'A scroll-linked Timeline/About section, adapted from Aceternity: entries reveal \u2014 and un-reveal on scroll-up \u2014 as their node crosses a viewport-relative trigger line, with the rail fill driven off scroll progress rather than a one-shot animation.',
            'A continuously scrolling skill carousel where both the loop duration and the number of copies are measured at runtime (`ResizeObserver` + a fixed px/second speed), so the marquee stays seamless at any viewport width instead of snapping at the loop boundary.',
            'A filterable project gallery with a deep-linkable detail view \u2014 every project has its own shareable URL.',
        ],
        tech: [
            'React 19',
            'TypeScript',
            'Vite',
            'Tailwind CSS v4',
            'Framer Motion',
            'shadcn-style UI primitives (@base-ui/react, class-variance-authority, tailwind-merge)',
            'Lucide React / developer-icons',
            'Geist Variable + Cinzel Variable (Fontsource)',
        ],
        /* The cover already renders full-width at the top of the detail view,
           so the gallery holds only the shot it does not repeat: the original
           site this pass superseded. */
        gallery: [
            { src: portfolio2Image, alt: 'The original Portfolio Website this redesign superseded' },
        ],
        links: [{ label: 'Code', href: 'https://github.com/Ali-Aryo/portfolio-website-III' }],
    },
    {
        slug: 'therassist',
        title: 'Therassist',
        context: 'Technation Hackathon',
        summary:
            'An AI pre-session screening tool for therapists: patients answer questions on camera while the app tracks facial emotion and transcribes their responses into a clinical summary.',
        tags: ['AI/ML', 'Hackathon', 'Web App',],
        cover: therassistCoverImage,
        coverAlt: 'The Therassist prototype interface',
        overview:
            'Therassist helps therapists prepare for upcoming sessions by having the patient go through a screening flow beforehand: the app shows therapy questions one at a time, tracks the patient\u2019s facial emotions in real time via webcam while they answer, records and transcribes their spoken responses, and generates an AI clinical report summarizing emotional patterns and transcript content for the clinician to review ahead of the real appointment. A deliberate privacy-first design choice runs emotion detection and speech-to-text entirely locally rather than through a cloud API, given the sensitivity of therapy data \u2014 only the final report-generation step calls out to an LLM, routed through TELUS\u2019s Sovereign AI Factory rather than a generic public API. Built at the Technation Hackathon.',
        highlights: [
            'Real-time facial emotion detection (DeepFace + OpenCV) streamed live to the frontend over WebSocket while the patient answers each question, rather than analyzed after the fact.',
            'Speech-to-text runs locally via OpenAI Whisper instead of a cloud API, keeping raw audio off third-party servers given the sensitivity of therapy session content.',
            'AI clinical report generation is routed through TELUS\u2019s Sovereign AI Factory \u2014 sovereign AI infrastructure built for healthcare-grade data privacy and compliance \u2014 rather than a generic public LLM endpoint.',
            'Full session pipeline in one sitting: question flow \u2192 live emotion + audio capture \u2192 transcription \u2192 LLM-generated summary \u2192 therapist-facing report, wired end-to-end during the hackathon.',
        ],
        tech: [
            'Next.js 16 (App Router)',
            'React 19',
            'TypeScript',
            'Tailwind CSS 4',
            'FastAPI (Python)',
            'DeepFace / TensorFlow-Keras',
            'OpenCV',
            'OpenAI Whisper (local)',
            'WebSocket streaming',
            'TELUS Sovereign AI Factory (LLM reports)',
        ],
        links: [
            { label: 'Code', href: 'https://github.com/Therassist-AI/Therassist' },
            { label: 'Demo Video', href: 'https://www.youtube.com/watch?v=oBSS91ltZRQ' },
        ],
    },
    {
        slug: 'phishnet-ai',
        title: 'PhishNet.AI',
        context: 'AI/ML Hackathon',
        summary:
            'A trained ML classifier that flags phishing emails and text, paired with a Learning Mode that trains users to spot phishing themselves.',
        tags: ['AI/ML', 'Hackathon', 'Web App'],
        cover: phishnetLogoImage,
        coverAlt: 'The PhishNet.AI logo: a fish caught in a glowing cyberpunk-style net',
        overview:
            'PhishNet.AI takes pasted email, Slack, Google Chat, or other text and classifies it as "Spam" (phishing) or "Not Spam" using a trained ML model, giving people a quick way to check something suspicious before acting on it. Beyond detection, a Learning Mode shows users real challenge emails, has them guess "Phishy" or "Not Phishy" themselves, and immediately compares their guess against both the model\u2019s prediction and the true label \u2014 framed explicitly as a tool to build the user\u2019s own phishing-recognition skill rather than just a black-box classifier.',
        highlights: [
            'A Support Vector Classifier trained on the SpamAssassin phishing-email dataset (Kaggle), with text represented via TF-IDF vectorization and RandomUnderSampler applied to correct the dataset\u2019s class imbalance.',
            'A consistent preprocessing pipeline (strip special characters/numbers, lowercase, NLTK stopword removal) applied identically at training and inference time, so the model sees the same shape of input it was trained on.',
            'Learning Mode turns the same model into a teaching tool: users guess phishy-or-not on real challenge emails and see their guess scored against both the model\u2019s prediction and the ground truth.',
            'Model and vectorizer are persisted with joblib and served through a Flask + Flask-RESTX API with interactive Swagger docs, with the training notebook and a written model-performance report kept in the repo.',
        ],
        tech: [
            'Python',
            'Flask / Flask-RESTX',
            'scikit-learn (SVC, TF-IDF)',
            'imbalanced-learn',
            'NLTK',
            'joblib',
            'pandas / NumPy',
            'HTML/CSS/JavaScript (frontend)',
        ],
        gallery: [
            {
                src: phishnetGalleryImage,
                alt: 'A pasted message flagged as Spam with 100% probability, next to a link into Learning Mode',
            },
        ],
        links: [
            { label: 'Code', href: 'https://github.com/Ali-Aryo/PhishNet.AI' },
            { label: 'Demo Video', href: 'https://youtu.be/rXw9ejR7Rac' },
        ],
    },
    {
        slug: 'clearcall',
        title: 'ClearCall',
        context: 'ENSC 429 - Digital Signal Processing, SFU',
        summary:
            'A speech-enhancement study comparing classical DSP, a pretrained deep-learning model, and two hybrids for stripping noise out of live voice/video calls.',
        tags: ['AI/ML', 'University'],
        cover: clearcallCoverImage,
        coverAlt: 'A noisy red waveform on the left resolving into a clean teal waveform on the right, illustrating speech enhancement',
        overview:
            "ClearCall is a Digital Signal Processing (ENSC 429) final project asking whether a hybrid of classical DSP and deep learning can beat either alone at cleaning up voice/video calls made from noisy environments (coffee shops, transit, shared apartments). The team designed and benchmarked five enhancement methods \u2014 a classical spectral-subtraction + Wiener-filter baseline, an improved DSP pipeline with speech-aware (MCRA-style) noise tracking, a pretrained DeepFilterNet3 model, and two DSP/DL hybrids \u2014 against the VoiceBank+DEMAND dataset using SNR improvement, PESQ-WB, and STOI, plus a real-time microphone-to-output implementation of the DSP methods.",
        highlights: [
            'Improved DSP pipeline redesigned the noise estimator from a sliding-minimum tracker to an MCRA-style speech-aware estimator, plus soft gain fusion and a gain floor \u2014 measurably ahead of the classical baseline on SNRi, PESQ-WB, and STOI while staying real-time.',
            'Two hybrid fusion strategies tested a specific hypothesis (DSP + DL beats either alone) and disproved it for one of them: fixed waveform/frequency-band fusion of DSP and DeepFilterNet3 output actually scored worse than DeepFilterNet3 alone, by reintroducing DSP-branch noise and distortion.',
            'A second hybrid instead used the DSP branch only as an RMS-level reference to calibrate DeepFilterNet3\u2019s output gain (with peak-safety clamping) \u2014 this one achieved the highest SNR improvement of all five methods.',
            'A real-time implementation of the DSP methods ran on live microphone input in 480-sample (10ms) blocks with a measured real-time factor around 0.04\u00d7 \u2014 well inside the deadline \u2014 and zero audio dropouts across the test sweep.',
            'Rigorous evaluation methodology: quantitative benchmarking (SNRi, PESQ-WB, STOI, processing latency, output-safety checks) against ~150 matched clean/noisy pairs, plus blind human listening ratings rather than relying on metrics alone.',
        ],
        tech: [
            'Python',
            'NumPy / SciPy (STFT, spectral subtraction, Wiener filtering)',
            'DeepFilterNet3 (pretrained)',
            'PESQ-WB / STOI evaluation (VoiceBank+DEMAND)',
            'Virtual microphone routing (real-time DSP demo)',
        ],
        links: [
            { label: 'Code', href: 'https://github.com/neema66/ClearCall' },
            { label: 'Report (PDF)', href: clearcallReportPdf },
            { label: 'Demo Slides (PDF)', href: clearcallDemoPdf },
        ],
    },
    {
        slug: 'fpga-geometry-dash',
        title: 'FPGA Geometry Dash',
        context: 'ENSC 452 - Advanced Digital Systems Design, SFU',
        summary:
            'A from-scratch Geometry Dash clone running bare-metal on a Zynq-7020 FPGA, with a custom VGA driver, dual-core audio/video split, and hardware-generated levels.',
        tags: ['Hardware', 'University'],
        cover: geometryDashCoverImage,
        coverAlt: 'A "LEVEL COMPLETE" screen on a monitor driven by a green ZedBoard FPGA sitting on the desk below it',
        overview:
            'A recreation of the rhythm-platformer Geometry Dash built entirely on a Xilinx Zynq-7020 (ZedBoard), with no operating system underneath. One ARM Cortex-A9 core runs the game engine, physics, collision detection, and a custom pixel-math VGA driver at a locked 60 FPS; the other core is dedicated entirely to streaming WAV audio from an SD card over I2S, so audio playback can never stutter the video. Two custom hardware IP blocks offload work that would otherwise compete with those cores: an 8-bit LFSR generates the endless-mode obstacle stream, and an Audio Threshold Detector compares live audio samples against a threshold in hardware to spawn obstacles in sync with a song\u2019s beat. Ships with three playable modes \u2014 a hardcoded standard level, an LFSR-driven endless mode, and an audio-reactive mode.',
        highlights: [
            'Dual-core split with zero shared-cache headaches: Core 0 (game logic + VGA rendering) and Core 1 (SD-card audio streaming) communicate only through a non-cacheable shared-memory mailbox, woken via the ARM sev() instruction \u2014 no cache coherency management needed since Core 1 runs with its cache disabled entirely.',
            'Two custom AXI-Lite hardware IP blocks: an 8-bit LFSR pseudo-random generator for the endless mode, and an Audio Threshold Detector with live-value, threshold, and flag registers that flags a beat hit directly in hardware for the audio-reactive mode.',
            'Every visual \u2014 menus, the player icon, spikes, even the 90-degree jump-flip rotation \u2014 is drawn with coordinate math and an open-source 8x8 ASCII font, not blitted from stored images, after an early pivot away from memcpy\u2019d placeholder art.',
            'A frame limiter on Core 0 holds VGA output to a strict 60 FPS regardless of obstacle count, after early builds visibly sped up and slowed down as on-screen complexity changed.',
            'WAV files (up to 30MB each) stream from a 64GB SD card through a FatFS wrapper rather than living in on-chip memory \u2014 a design pivot forced once the audio library size outgrew what the FPGA\u2019s own memory could hold.',
        ],
        tech: [
            'Xilinx Zynq-7020 (ZedBoard)',
            'Vivado (custom AXI-Lite IP blocks)',
            'Vitis / C++ (bare-metal, dual-core ARM Cortex-A9)',
            'Custom VGA controller (1280x1024 @ 60Hz)',
            'ADAU1761 audio codec (I2S)',
            'FatFs (SD card WAV streaming)',
        ],
        gallery: [
            {
                src: geometryDashGallery1Image,
                alt: 'The FPGA Geometry Dash title screen on a monitor, showing the switch map for pause, level select, endless mode, and audio mode',
            },
            {
                src: geometryDashGallery2Image,
                alt: 'The green ZedBoard FPGA on a desk, wired to the monitor over VGA with its heatsink and switches visible',
            },
        ],
        links: [
            { label: 'Code', href: 'https://github.com/Ali-Aryo/FPGA-Geometry-Dash' },
            { label: 'Demo Video', href: 'https://youtu.be/m1siOqd2qdY' },
            { label: 'Report (PDF)', href: geometryDashReportPdf },
            { label: 'Demo Slides (PDF)', href: geometryDashDemoPdf },
        ],
    },
    {
        slug: 'website-portfolio',
        title: 'Website Portfolio',
        context: 'Personal',
        summary:
            'This site. A single-page portfolio built around a full-bleed video hero and a frosted-glass component system.',
        tags: ['Website', 'Deployed'],
        cover: portfolioImage,
        coverAlt: 'The portfolio hero section',
        overview:
            'A personal portfolio built from scratch rather than from a template. The whole page sits over one pinned background layer, so every section below the hero reads as frosted glass floating over the same scene instead of as a stack of separate blocks.',
        highlights: [
            'A reusable `liquid-glass` utility built from layered inset highlights, so panels read as a lit slab of glass rather than a flat tinted box.',
            'A full-bleed video hero that falls back to a poster frame and pauses itself under prefers-reduced-motion.',
            'A filterable project gallery with a deep-linkable detail view — every project has its own shareable URL.',
            'Scroll-linked reveals that play in reverse when you scroll back up, rather than firing once and locking.',
        ],
        tech: [
            'React 19',
            'TypeScript',
            'Vite',
            'Tailwind CSS v4',
            'Framer Motion',
        ],
        /* The cover already renders full-width at the top of the detail
           view, so the gallery holds only the shots it does not repeat. */
        gallery: [
            { src: portfolioImage, alt: 'An earlier iteration of the layout' },
        ],
        links: [{ label: 'Code', href: 'https://github.com/' }],
    },
    {
        slug: 'mindful-memories',
        title: 'Mindful Memories',
        context: 'CMPT 276, SFU - Software Engineering',
        summary:
            'An Android app for reminiscence therapy: caregivers build photo-based memory quizzes for people with dementia to practice recall at their own pace.',
        tags: ['Mobile', 'University'],
        cover: mindfulMemoriesCoverImage,
        coverAlt: 'The caregiver-facing Upload Memory screen: a photo picker plus fields for a question, answer, and multiple-choice options',
        overview:
            'Mindful Memories supports reminiscence therapy for people with dementia (PWD). Caregivers upload a patient\u2019s own photos and pair each one with a multiple-choice question about the memory it captures (\u201cWho is this?\u201d / \u201cWhere was this taken?\u201d); the patient then works through these as daily challenges at their own pace, gets encouragement and correct/incorrect feedback, and can exit at any time \u2014 no forced completion. Built for people in the early-to-medium stages of dementia and the caregivers or family members who build the memory content, with the team\u2019s explicit framing that this isn\u2019t a cure: the goal is to make practicing memory stress-free and help delay memory-loss symptoms through repetition-based cognitive exercise. Built as the CMPT 276 (Software Engineering) group project at SFU.',
        highlights: [
            'Caregiver-facing memory builder: upload a photo (gallery or camera), name the memory, then define a question, correct answer, and up to three distractor options before saving it into the patient\u2019s exercise set.',
            'Progress tracking with motivational feedback rather than a pass/fail score, designed around low-stress, self-paced practice for a cognitively-impaired user.',
            'A five-person team split across backend (Java/Android + Firebase) and frontend/design, shipped as a full CMPT 276 group deliverable across 54 commits and 15 branches.',
            'Framed explicitly as a concept with a stated two-year real-world adoption horizon rather than a shipped product \u2014 the team\u2019s own honest scoping of what a semester project can claim.',
        ],
        tech: [
            'Android (Java)',
            'Android Studio',
            'Firebase',
            'Canva (design/assets)',
        ],
        links: [
            { label: 'Code', href: 'https://gitlab.com/aliaryo2004/mindful-memories' },
            { label: 'Website', href: 'https://laraclemos.wixsite.com/mindful-memories' },
            { label: 'Demo Video', href: 'https://youtu.be/0pK_cgNPLDc' },
        ],
    },

]

/**
 * Tags that at least one project carries, in PROJECT_TAGS order. Deriving this
 * instead of hardcoding the chip row means a filter can never point at an empty
 * grid, and retagging a project updates the chips for free.
 */
export function usedTags(list: Project[] = projects): ProjectTag[] {
    return PROJECT_TAGS.filter((tag) => list.some((p) => p.tags.includes(tag)))
}

export function findProjectBySlug(slug: string): Project | undefined {
    return projects.find((p) => p.slug === slug)
}
