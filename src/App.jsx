import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import * as API from './api.js';
import {
  Sparkles, Calendar, LayoutTemplate, Home, PenTool, Clock, Send, Copy,
  ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Eye, Hash, AtSign,
  TrendingUp, Users, FileText, Zap, BookOpen, Briefcase, MessageSquare,
  Heart, ThumbsUp, Share2, MoreHorizontal, Globe, Image, Smile, Target,
  Check, X, Search, Filter, Bell, Settings, LogOut, Moon, Sun, Star,
  RefreshCw, Download, ArrowRight, Lightbulb, Award, Coffee, Rocket,
  BarChart3, Link2, Unlink, Camera, MapPin, Flag, Trophy, Flame,
  ChevronDown, ExternalLink, Play, Pause, AlertCircle, CheckCircle2,
  ImageIcon, Loader, ArrowUpRight, Activity, Linkedin
, RotateCcw, AlertTriangle,
  Upload, ChevronUp
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   CONSTANTS & DATA
   ════════════════════════════════════════════════════════════════════ */
const TONES = [
  { id: "professional", label: "Professionnel", icon: Briefcase, color: "#818cf8" },
  { id: "inspiring", label: "Inspirant", icon: Lightbulb, color: "#fbbf24" },
  { id: "storytelling", label: "Storytelling", icon: BookOpen, color: "#f472b6" },
  { id: "educational", label: "Éducatif", icon: Award, color: "#34d399" },
  { id: "casual", label: "Décontracté", icon: Coffee, color: "#a78bfa" },
  { id: "engaging", label: "Engageant", icon: Rocket, color: "#fb7185" },
];

const CATEGORIES = [
  { id: "job_offer", label: "Offres d'emploi", icon: Briefcase, color: "#818cf8", target: 20 },
  { id: "promo_services", label: "Nos services", icon: Zap, color: "#f43f5e", target: 15 },
  { id: "prospection", label: "Prospection", icon: Target, color: "#e879f9", target: 10 },
  { id: "employer_brand", label: "Marque employeur", icon: Award, color: "#2dd4bf", target: 10 },
  { id: "hr_news", label: "Actualité RH", icon: TrendingUp, color: "#34d399", target: 12 },
  { id: "consultant", label: "Vie consultant", icon: Users, color: "#fbbf24", target: 8 },
  { id: "outremer", label: "Outre-Mer", icon: MapPin, color: "#38bdf8", target: 8 },
  { id: "testimony", label: "Témoignages", icon: MessageSquare, color: "#f472b6", target: 7 },
  { id: "motivation", label: "Motivation", icon: Star, color: "#fb923c", target: 5 },
  { id: "case_study", label: "Cas client", icon: FileText, color: "#60a5fa", target: 5 },
];

const HASHTAG_SETS = {
  job_offer: ["#Recrutement", "#Emploi", "#RH", "#Talents", "#Carrière", "#Hiring", "#Outremer"],
  promo_services: ["#CabinetRecrutement", "#TalentysRH", "#ExternalisationRH", "#Recrutement", "#RPO", "#ConseilRH", "#Outremer"],
  prospection: ["#Recrutement", "#DéveloppementRH", "#Entreprises", "#Croissance", "#TalentysRH", "#PartenariatRH"],
  employer_brand: ["#MarqueEmployeur", "#EmployerBranding", "#Attractivité", "#RH", "#FidélisationTalents", "#CultureEntreprise"],
  hr_news: ["#RH", "#ActuRH", "#Management", "#TendancesRH", "#Innovation", "#MarchéEmploi"],
  consultant: ["#ConsultantRH", "#VieDeConsultant", "#TalentysRH", "#Recruteur", "#MétierRH"],
  outremer: ["#OutreMer", "#Martinique", "#Guadeloupe", "#Guyane", "#LaRéunion", "#Mayotte"],
  testimony: ["#Témoignage", "#Parcours", "#Inspiration", "#Réussite", "#SuccessStory"],
  motivation: ["#Motivation", "#Inspiration", "#Succès", "#Mindset", "#Leadership"],
  case_study: ["#CasClient", "#RéussiteRH", "#RecrutementRéussi", "#TalentysRH", "#ROI", "#Performance"],
};

const TEMPLATES = [
  { id: 1, category: "job_offer", title: "Offre d'emploi attractive", content: "🚀 [ENTREPRISE] recrute !\n\nNous recherchons un(e) [POSTE] passionné(e) pour rejoindre notre équipe à [LIEU].\n\n✅ Ce que nous offrons :\n→ Un environnement stimulant\n→ Des opportunités d'évolution\n→ Une rémunération attractive\n\n📩 Intéressé(e) ? Envoyez votre CV ou contactez-moi en DM !\n\n#Recrutement #Emploi #Outremer #Talents", preview: "Template idéal pour mettre en avant une offre d'emploi" },
  { id: 2, category: "job_offer", title: "Recherche profil spécifique", content: "🔎 À la recherche d'un talent rare !\n\nMon client, acteur majeur de [SECTEUR] en [TERRITOIRE], cherche son/sa futur(e) [POSTE].\n\n🎯 Le profil idéal :\n→ [COMPÉTENCE 1]\n→ [COMPÉTENCE 2]\n→ [COMPÉTENCE 3]\n\n💡 Vous vous reconnaissez ? Parlons-en !\n\n📞 Contactez Talentys RH\n\n#Recrutement #Talent #RH #Outremer", preview: "Pour chercher un profil précis sur LinkedIn" },
  { id: 3, category: "hr_news", title: "Conseil RH de la semaine", content: "💡 Le conseil RH de la semaine\n\n[SUJET DU CONSEIL]\n\nVoici 3 actions concrètes :\n\n1️⃣ [ACTION 1]\n→ [Explication courte]\n\n2️⃣ [ACTION 2]\n→ [Explication courte]\n\n3️⃣ [ACTION 3]\n→ [Explication courte]\n\n📌 Enregistrez ce post pour y revenir !\n\nQuel est votre plus grand défi RH actuellement ? 👇\n\n#RH #ConseilRH #Management", preview: "Partager un conseil RH sous forme actionnable" },
  { id: 4, category: "hr_news", title: "Tendance du marché", content: "📊 Tendance RH 2026 : [SUJET]\n\n[Statistique marquante]\n\nCe que cela signifie pour les entreprises ultramarines :\n\n1️⃣ [Impact 1]\n2️⃣ [Impact 2]\n3️⃣ [Impact 3]\n\n🔮 Ma prédiction : [Votre analyse]\n\nComment votre entreprise s'adapte-t-elle ? 👇\n\n#TendancesRH #MarchéEmploi #Outremer", preview: "Partager une tendance du marché de l'emploi" },
  { id: 5, category: "consultant", title: "Coulisses du métier", content: "📸 Behind the scenes chez Talentys RH !\n\n[Description du moment]\n\nCe qui rend notre métier unique :\n\n🤝 [Valeur 1]\n💡 [Valeur 2]\n🌴 [Valeur 3 liée à l'Outre-Mer]\n\nTravailler dans le recrutement en Outre-Mer, c'est avant tout une aventure humaine.\n\n#ConsultantRH #TalentysRH #Outremer", preview: "Montrer les coulisses du métier" },
  { id: 6, category: "outremer", title: "Actu économique Outre-Mer", content: "🌴 [TERRITOIRE] — Actu économique\n\n[Fait marquant ou statistique]\n\nCe que cela représente pour l'emploi local :\n\n→ [Opportunité 1]\n→ [Opportunité 2]\n→ [Impact sur le recrutement]\n\nLes territoires d'Outre-Mer regorgent de potentiel ! 🚀\n\n#OutreMer #Économie #Emploi #Développement", preview: "Partager une actualité économique ultramarine" },
  { id: 7, category: "testimony", title: "Success story candidat", content: "🌟 Success Story 🌟\n\nIl y a [DURÉE], [PRÉNOM] cherchait un nouveau défi professionnel.\n\nAujourd'hui, il/elle est [POSTE] chez [ENTREPRISE] !\n\nSon parcours :\n📍 D'où : [Situation initiale]\n🚀 Vers où : [Situation actuelle]\n💪 La clé : [Ce qui a fait la différence]\n\nFélicitations [PRÉNOM] ! 🎉\n\n#Réussite #Talents #Outremer #TalentysRH", preview: "Valoriser le parcours d'un candidat placé" },
  { id: 8, category: "testimony", title: "Retour client satisfait", content: "\" [CITATION DU CLIENT] \"\n\nMerci à [ENTREPRISE] pour cette belle collaboration ! 🙏\n\n📋 Le contexte :\n→ [Besoin initial]\n\n🎯 Notre solution :\n→ [Ce que Talentys a fait]\n\n✅ Le résultat :\n→ [Résultat concret]\n\n#Témoignage #Satisfaction #RH #TalentysRH", preview: "Valoriser un retour positif d'un client" },
  { id: 9, category: "motivation", title: "Citation inspirante", content: "\" [CITATION] \"\n— [AUTEUR]\n\nCette phrase résonne particulièrement avec moi aujourd'hui.\n\n[Votre réflexion personnelle en 2-3 lignes]\n\nDans le monde du recrutement, [lien avec le métier].\n\n💬 Quelle citation vous motive au quotidien ?\n\n#Motivation #Inspiration #Leadership", preview: "Post inspirant autour d'une citation" },
  { id: 10, category: "motivation", title: "Leçon de carrière", content: "🎓 La plus grande leçon de ma carrière :\n\n[Leçon principale]\n\nL'histoire :\nIl y a [DURÉE], j'ai [situation/erreur/défi].\nRésultat ? [Ce qui s'est passé]\n\nCe que j'en retiens :\n→ [Enseignement 1]\n→ [Enseignement 2]\n→ [Enseignement 3]\n\nEt vous, quelle a été votre plus grande leçon ? 👇\n\n#Apprentissage #Carrière #Développement", preview: "Partager une leçon de carrière" },
  { id: 11, category: "promo_services", title: "Présentation des services Talentys", content: "🎯 Vous recrutez en Outre-Mer ? Parlons-en.\n\nChez Talentys RH, nous accompagnons les entreprises de [TERRITOIRE] dans leurs recrutements stratégiques.\n\nNos services :\n\n✅ Recrutement par approche directe\n→ Nous identifions les meilleurs profils, y compris passifs\n\n✅ RPO (Recruitment Process Outsourcing)\n→ Nous pilotons votre process recrutement de A à Z\n\n✅ Conseil en organisation RH\n→ Grilles salariales, fiches de poste, onboarding\n\n✅ Chasse de cadres & dirigeants\n→ Discrétion, réseau local, expertise sectorielle\n\n📞 Un besoin ? Un poste à pourvoir ?\nContactez-moi en DM ou sur marc.beauzile@talentysrh.com\n\n#CabinetRecrutement #TalentysRH #Outremer #Recrutement", preview: "Présenter l'offre de services complète de Talentys RH" },
  { id: 12, category: "promo_services", title: "Problème / Solution", content: "❌ Le problème :\nVotre dernier recrutement a pris 4 mois.\nLe candidat est parti au bout de 3.\n\n✅ La solution Talentys RH :\n\n📋 Diagnostic du besoin réel (pas juste une fiche de poste)\n🔎 Sourcing ciblé avec notre réseau local de [X] contacts\n🎯 Shortlist qualifiée en 3 semaines max\n🤝 Accompagnement jusqu'à la fin de la période d'essai\n\nRésultat ? 92% de nos placements sont encore en poste après 1 an.\n\n📩 Discutons de votre prochain recrutement.\n\n#Recrutement #RPO #TalentysRH #Outremer #Performance", preview: "Format problème/solution pour convertir des prospects" },
  { id: 13, category: "promo_services", title: "Chiffres clés Talentys", content: "📊 Talentys RH en chiffres :\n\n🏆 [X] recrutements réussis\n⏱️ [X] jours en moyenne pour une shortlist\n✅ [X]% de taux de rétention à 1 an\n🌴 [X] territoires couverts en Outre-Mer\n🤝 [X] entreprises clientes fidèles\n\nDerrière ces chiffres, une conviction :\nle bon recrutement change la trajectoire d'une entreprise.\n\nVous méritez le bon partenaire RH.\n\n📞 Parlons de vos enjeux.\n\n#CabinetRecrutement #TalentysRH #Résultats #Outremer", preview: "Mettre en avant les résultats chiffrés du cabinet" },
  { id: 14, category: "prospection", title: "Interpellation dirigeant", content: "👔 Dirigeant en Outre-Mer, cette question est pour vous :\n\nCombien vous coûte un recrutement raté ?\n\n💸 Coût direct : salaire versé + charges + formation\n⏳ Coût indirect : temps perdu, impact équipe, clients\n😰 Coût caché : démotivation, turn-over en chaîne\n\nOn estime qu'un mauvais recrutement coûte entre 30 000€ et 150 000€.\n\nLa bonne nouvelle ?\nUn cabinet spécialisé réduit ce risque de 70%.\n\nEnvie de sécuriser vos prochains recrutements ?\n\n📩 Message privé = premier échange offert\n\n#Dirigeant #Recrutement #ROI #Outremer #TalentysRH", preview: "Post d'interpellation pour capter l'attention des dirigeants" },
  { id: 15, category: "prospection", title: "Offre découverte", content: "🎁 Offre spéciale — Mars 2026\n\nVous n'avez jamais travaillé avec un cabinet de recrutement ?\n\nJe vous propose un premier audit RH offert :\n\n✅ Analyse de votre besoin en 30 min\n✅ Benchmark salarial sur votre poste\n✅ Recommandations sourcing personnalisées\n\nSans engagement. Juste de la valeur.\n\nPourquoi ? Parce que je suis convaincu qu'une fois que vous aurez vu la différence, vous ne reviendrez pas en arrière.\n\n📩 Intéressé(e) ? Commentez \"AUDIT\" ou envoyez-moi un DM\n\n#Audit #RH #Recrutement #OffreSpéciale #TalentysRH", preview: "Proposition d'offre découverte pour générer des leads" },
  { id: 16, category: "prospection", title: "Avant / Après client", content: "📉 AVANT Talentys RH :\n→ 6 mois pour recruter un cadre\n→ 2 recrutements ratés sur 3\n→ Budget RH explosé\n→ Équipe démotivée\n\n📈 APRÈS Talentys RH :\n→ Shortlist qualifiée en 3 semaines\n→ 95% de satisfaction client\n→ Budget maîtrisé, ROI mesurable\n→ Équipe renforcée et stable\n\nLa différence ? Un partenaire RH qui connaît votre territoire.\n\n🤝 Prêt à transformer votre recrutement ?\n\n📞 Contactez Talentys RH\n\n#Recrutement #Transformation #ROI #Outremer #TalentysRH", preview: "Comparaison avant/après pour démontrer la valeur ajoutée" },
  { id: 17, category: "employer_brand", title: "Conseils marque employeur", content: "🏢 Votre marque employeur en Outre-Mer : 5 leviers sous-estimés\n\nAttirer les meilleurs talents ne dépend pas que du salaire.\n\n1️⃣ Culture d'entreprise visible\n→ Montrez vos coulisses sur LinkedIn !\n\n2️⃣ Témoignages collaborateurs authentiques\n→ Vidéo smartphone > plaquette corporate\n\n3️⃣ Process de recrutement fluide\n→ Un candidat qui attend 3 semaines = un candidat perdu\n\n4️⃣ Onboarding soigné\n→ Les 90 premiers jours font TOUT\n\n5️⃣ Avantages locaux valorisés\n→ Cadre de vie, proximité, sens du collectif\n\nBesoin d'aide pour structurer votre marque employeur ?\n\n📩 Contactez Talentys RH\n\n#MarqueEmployeur #Attractivité #RH #Outremer", preview: "Conseils pour améliorer l'attractivité employeur" },
  { id: 18, category: "employer_brand", title: "Erreurs marque employeur", content: "⚠️ Les 3 erreurs qui font fuir vos candidats en Outre-Mer :\n\n❌ Erreur n°1 : Offre d'emploi copier-coller\n→ Adaptez au territoire et au profil visé\n\n❌ Erreur n°2 : Aucune présence sur LinkedIn\n→ 80% des cadres regardent votre page avant de postuler\n\n❌ Erreur n°3 : Process de recrutement interminable\n→ Les bons profils sont pris en 10 jours\n\n✅ La solution ?\nUne stratégie de marque employeur adaptée à l'Outre-Mer.\n\nC'est exactement ce que nous construisons avec nos clients chez Talentys RH.\n\n💬 Quel est votre plus grand défi d'attractivité ?\n\n#MarqueEmployeur #Recrutement #EmployerBranding #Outremer", preview: "Pointer les erreurs courantes pour positionner Talentys comme solution" },
  { id: 19, category: "case_study", title: "Étude de cas recrutement", content: "📋 ÉTUDE DE CAS — Recrutement [POSTE]\n\n🏢 Client : [SECTEUR] en [TERRITOIRE]\n⏱️ Délai : [X] semaines\n✅ Résultat : poste pourvu, candidat toujours en poste\n\nLe contexte :\n[Le client avait besoin de... / Le poste était vacant depuis...]\n\nNotre approche :\n1️⃣ [Étape 1 : Audit du besoin]\n2️⃣ [Étape 2 : Sourcing ciblé]\n3️⃣ [Étape 3 : Shortlist + entretiens]\n4️⃣ [Étape 4 : Accompagnement intégration]\n\nLe résultat :\n→ [Résultat concret + feedback client]\n\n📩 Vous avez un poste similaire à pourvoir ?\n\n#CasClient #Recrutement #TalentysRH #Outremer #Résultat", preview: "Présenter un cas concret de recrutement réussi" },
  { id: 20, category: "case_study", title: "ROI d'un recrutement réussi", content: "💰 Le ROI d'un recrutement réussi — Cas réel\n\n📊 Contexte :\nNotre client en [TERRITOIRE] perdait [X]€/mois à cause d'un poste clé vacant.\n\n🎯 Notre intervention :\n→ Délai de placement : [X] semaines\n→ Investissement client : [X]€\n→ Profil identifié : [Description courte]\n\n📈 Résultats à 6 mois :\n→ +[X]% de productivité du service\n→ [X]€ de CA additionnel généré\n→ ROI du recrutement : [X]×\n\nLe bon recrutement n'est pas une dépense.\nC'est un investissement.\n\n📞 Parlons de votre prochain recrutement stratégique.\n\n#ROI #Recrutement #Performance #TalentysRH #Outremer", preview: "Démontrer le retour sur investissement d'un bon recrutement" },
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/* ═══ AI GENERATION ENGINE v2 — CONTEXT-AWARE ═══ */
const generateAIPost = (topic, tone, category, includeHashtags, includeCTA) => {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const t = topic.trim();

  /* ── Category-specific intelligent generators ── */
  const generators = {
    job_offer: () => {
      const hooks = [
        `🚀 ${t}\n\nNous avons une opportunité concrète à partager avec notre réseau.`,
        `🔎 Avis aux profils ${t} !\n\nUne entreprise ultramarine recherche activement ce talent.`,
        `💼 Offre — ${t}\n\nCe poste vient d'ouvrir. Et il ne restera pas longtemps en ligne.`,
      ];
      return pick(hooks) + `\n\nSi vous êtes intéressé(e) ou connaissez le bon profil, contactez-moi directement en DM.\n\nLe recrutement en Outre-Mer demande un réseau local solide — c'est notre force chez Talentys RH.`;
    },
    promo_services: () => {
      const angles = [
        `🎯 ${t}\n\nEn Outre-Mer, recruter n'est pas une simple formalité.\n\nBassin de candidats restreint, concurrence accrue entre employeurs, attentes salariales en hausse : les règles du jeu sont différentes.\n\nC'est pour ça que Talentys RH existe.\n\nNotre approche :\n→ Diagnostic approfondi de votre besoin réel (pas juste une fiche de poste)\n→ Sourcing ciblé en activant notre réseau de +2000 contacts qualifiés\n→ Shortlist en 3 semaines maximum\n→ Accompagnement jusqu'à la validation de la période d'essai\n\nRésultat : 92% de nos placements sont encore en poste après 1 an.\n\n📞 Un poste à pourvoir ? Parlons-en sans engagement.`,
        `💡 ${t}\n\nVous hésitez entre recruter seul ou passer par un cabinet ?\n\nVoici ce que disent les chiffres :\n→ Un recrutement raté coûte entre 30 000€ et 150 000€\n→ Le délai moyen d'un recrutement en Outre-Mer : 4 à 6 mois en autonome\n→ Avec Talentys RH : 3 semaines pour une shortlist qualifiée\n\nNotre valeur ajoutée ne se mesure pas qu'au placement.\nElle se mesure aux talents qui restent.\n\n📩 Premier échange offert — contactez-moi en DM.`,
        `⚡ ${t}\n\nCe que nos clients nous disent le plus souvent :\n\n"J'aurais dû vous appeler plus tôt."\n\nPourquoi ?\n→ Parce qu'on connaît le tissu économique ultramarin de l'intérieur\n→ Parce qu'on ne présente que des candidats qu'on a réellement évalués\n→ Parce qu'on reste impliqués bien après la signature\n\nTalentys RH, cabinet de recrutement spécialisé Outre-Mer.\nMartinique • Guadeloupe • Guyane • Réunion • Mayotte`,
      ];
      return pick(angles);
    },
    prospection: () => {
      const angles = [
        `👔 ${t}\n\nDirigeant, DRH, manager en Outre-Mer :\n\nSi vous avez un poste clé vacant depuis plus de 2 mois, ce post est pour vous.\n\nChaque semaine sans le bon profil, c'est :\n→ De la charge de travail répartie sur les autres\n→ Des projets en attente\n→ Du chiffre d'affaires non réalisé\n\nCe qu'un partenaire recrutement local change :\n→ Accès aux candidats passifs (ceux qui ne postulent pas seuls)\n→ Benchmark salarial adapté à votre territoire\n→ Process structuré = délai divisé par 3\n\n📩 Premier échange sans engagement.\nContactez-moi en DM ou sur marc.beauzile@talentysrh.com`,
        `📊 ${t}\n\nUn chiffre qui fait réfléchir :\n\n87% des dirigeants ultramarins disent avoir du mal à recruter des cadres.\n\nEt pourtant, les talents existent. Ils sont juste invisibles sur les canaux classiques.\n\nChez Talentys RH, on active 3 leviers que vous n'avez probablement pas :\n\n1️⃣ L'approche directe — on va chercher les profils là où ils sont\n2️⃣ Le réseau diaspora — les talents ultramarins de l'Hexagone prêts à revenir\n3️⃣ Le vivier confidentiel — nos candidats qualifiés en veille active\n\nVous avez un poste difficile à pourvoir ?\nC'est exactement notre spécialité.\n\n📞 Discutons de votre enjeu.`,
      ];
      return pick(angles);
    },
    hr_news: () => {
      const angles = [
        `📰 ${t}\n\nVoici mon analyse terrain, depuis les territoires d'Outre-Mer.\n\nCe que j'observe au quotidien chez nos clients :\n\n1️⃣ La rémunération ne suffit plus à fidéliser\n→ Les collaborateurs veulent du sens, de la flexibilité et de la reconnaissance\n\n2️⃣ Le recrutement devient un enjeu de direction générale\n→ Ce n'est plus seulement "un problème RH"\n\n3️⃣ L'expérience candidat fait ou défait votre réputation\n→ Un process trop long = un candidat perdu au profit du concurrent\n\nComment votre entreprise s'adapte-t-elle ?\n\n💬 Je suis curieux de connaître vos retours d'expérience 👇`,
        `💡 ${t}\n\n3 tendances RH que je constate en Outre-Mer en ce moment :\n\n📈 Tendance 1 : La montée du recrutement par compétences\n→ Les diplômes comptent moins que la capacité à s'adapter et à performer\n\n🌍 Tendance 2 : Le retour des talents de la diaspora\n→ De plus en plus de cadres ultramarins en Hexagone veulent revenir au pays\n\n🤖 Tendance 3 : La digitalisation accélérée des process RH\n→ ATS, entretiens vidéo, onboarding digital — même en Outre-Mer\n\nLe monde du travail change. Les entreprises qui s'adaptent prendront une longueur d'avance.\n\n📌 Enregistrez ce post pour y revenir.`,
      ];
      return pick(angles);
    },
    employer_brand: () => {
      const angles = [
        `🏢 ${t}\n\nEn 2026, votre marque employeur est votre premier outil de recrutement.\n\nEn Outre-Mer, le bassin de talents est plus restreint. Les bons profils choisissent leur employeur, pas l'inverse.\n\n5 actions concrètes pour vous démarquer :\n\n1️⃣ Publiez régulièrement sur LinkedIn (même en tant que dirigeant)\n2️⃣ Partagez des témoignages authentiques de vos collaborateurs\n3️⃣ Affichez la transparence salariale — les candidats le demandent\n4️⃣ Réduisez votre process de recrutement à 2 semaines max\n5️⃣ Investissez dans l'onboarding — les 90 premiers jours font tout\n\nUn candidat qui dit "j'ai envie de rejoindre cette boîte" avant même de voir l'offre, c'est l'objectif.\n\nBesoin d'un regard extérieur ? Parlons-en.`,
        `⚠️ ${t}\n\nLes 3 erreurs qui font fuir vos candidats en Outre-Mer :\n\n❌ Publier une offre d'emploi générique copiée-collée\n→ Adaptez au territoire, au secteur et au profil visé\n\n❌ Avoir un process de recrutement en 5 étapes sur 3 mois\n→ Les meilleurs profils sont captés en 10 jours\n\n❌ Ne rien montrer de votre entreprise sur les réseaux\n→ 80% des cadres vérifient votre page LinkedIn avant de postuler\n\nVotre marque employeur se construit chaque jour.\nAvec ou sans vous.\n\nAutant que ce soit avec vous, non ?`,
      ];
      return pick(angles);
    },
    consultant: () => {
      const angles = [
        `📸 ${t}\n\nÊtre consultant en recrutement en Outre-Mer, c'est un métier à part.\n\nCe que ne disent pas les fiches de poste :\n\n→ Vous devenez le confident des candidats ET des dirigeants\n→ Vous connaissez la réalité économique de chaque territoire\n→ Vous gérez l'urgence d'un poste à pourvoir ET la patience d'un marché tendu\n→ Vous célébrez quand "ça matche" — pour de vrai\n\nChez Talentys RH, on vit ça au quotidien. En Martinique, Guadeloupe, Guyane, Réunion, Mayotte.\n\nEt on cherche d'ailleurs de nouveaux consultants pour nous rejoindre !\n\n📩 Intéressé(e) ? Parlons-en.`,
        `🌴 ${t}\n\nUne semaine type chez Talentys RH ? Ça n'existe pas.\n\nLundi : brief client pour un poste de directeur financier en Guyane\nMardi : 4 entretiens candidats, dont un profil diaspora qui veut rentrer\nMercredi : visite client à Fort-de-France, on cale la stratégie sourcing\nJeudi : négociation salariale délicate — trouvé le compromis\nVendredi : un candidat placé il y a 6 mois m'envoie un message de remerciement\n\nC'est ça, notre quotidien. Chaque jour différent. Chaque placement, une fierté.`,
      ];
      return pick(angles);
    },
    outremer: () => {
      const angles = [
        `🌴 ${t}\n\nL'économie ultramarine bouge. Et le marché de l'emploi avec.\n\nCe que j'observe sur le terrain :\n\n→ De nouveaux secteurs émergent : numérique, énergies renouvelables, santé\n→ Des groupes nationaux investissent davantage dans les DOM\n→ La diaspora ultramarine représente un vivier de talents sous-exploité\n\nMais les défis restent réels :\n→ Coût de la vie élevé et décalage salarial persistant\n→ Fuite des cerveaux à endiguer\n→ Besoin de formation et d'accompagnement RH renforcé\n\nL'Outre-Mer regorge de potentiel. Il faut juste les bons partenaires pour le révéler.\n\nC'est la mission que s'est donnée Talentys RH.`,
        `🗺️ ${t}\n\nMartinique, Guadeloupe, Guyane, Réunion, Mayotte.\n\n5 territoires. 5 marchés de l'emploi. 5 réalités différentes.\n\nCe qui les unit :\n→ Des entrepreneurs résilients et ambitieux\n→ Des talents locaux qui méritent de meilleures opportunités\n→ Un besoin criant de structuration RH\n\nCe qui les différencie :\n→ Chaque bassin d'emploi a ses métiers en tension\n→ Chaque territoire a sa culture managériale\n→ Chaque marché a ses propres règles de négociation\n\nComprendre ces nuances, c'est notre métier.\nDepuis le terrain, pas depuis Paris.`,
      ];
      return pick(angles);
    },
    testimony: () => {
      const angles = [
        `🌟 ${t}\n\nHistoire vraie (prénom modifié pour confidentialité) :\n\nSophie, 34 ans, comptable senior en région parisienne.\nOriginaire de Martinique, elle rêvait de rentrer au pays depuis 3 ans.\n\nSon frein ? "Je ne trouverai jamais un poste équivalent là-bas."\n\nRéalité :\n→ En 2 semaines, nous lui avons présenté 2 opportunités\n→ Elle a passé ses entretiens en visio\n→ CDI signé en 1 mois\n→ Aujourd'hui, elle pilote la finance d'un groupe martiniquais\n\nSon message : "J'aurais dû appeler Talentys plus tôt."\n\nLes talents ultramarins de la diaspora sont prêts à revenir.\nEncore faut-il leur montrer que les opportunités existent.\n\nC'est notre mission.`,
        `🏆 ${t}\n\nRetour d'expérience client :\n\nUn groupe guadeloupéen nous contacte. Poste clé vacant depuis 5 mois. 2 recrutements ratés.\n\nNotre diagnostic :\n→ La fiche de poste ne reflétait pas le vrai besoin\n→ Le process était trop long (4 étapes, 2 mois)\n→ Le positionnement salarial était sous le marché\n\nNotre intervention :\n→ Recalibrage du besoin avec le DG\n→ Benchmark salarial adapté au territoire\n→ Shortlist de 3 profils en 18 jours\n\nRésultat : candidat recruté, toujours en poste 10 mois après.\n\nLa clé d'un bon recrutement ? Comprendre le vrai besoin avant de sourcer.`,
      ];
      return pick(angles);
    },
    motivation: () => {
      const angles = [
        `💪 ${t}\n\nCe que 10 ans de recrutement en Outre-Mer m'ont appris :\n\n1. Les meilleurs profils ne sont pas toujours ceux qui ont le meilleur CV\n→ L'engagement et l'adaptabilité battent souvent l'expérience pure\n\n2. Dire non à une mission qui ne vous correspond pas, c'est se respecter\n→ Mieux vaut le bon poste que n'importe quel poste\n\n3. Le réseau n'est pas un carnet d'adresses. C'est un écosystème de confiance\n→ Chaque relation compte, même celle qui ne "sert à rien" aujourd'hui\n\nÀ tous les professionnels en Outre-Mer qui cherchent, qui doutent, qui persistent :\n\nVotre territoire a besoin de vos compétences. Ne lâchez pas.`,
        `🔑 ${t}\n\nConviction du jour :\n\nLe talent n'a pas de frontière. Mais il a besoin du bon terreau pour s'épanouir.\n\nEn Outre-Mer, ce terreau c'est :\n→ Une entreprise qui voit au-delà du CV\n→ Un manager qui fait confiance\n→ Un environnement qui valorise l'humain autant que la performance\n\nChaque jour chez Talentys RH, on travaille à créer ces connexions.\n\nPas juste placer un candidat.\nPermettre à un talent de trouver SA place.\n\n💬 C'est quoi pour vous, le bon terreau professionnel ?`,
      ];
      return pick(angles);
    },
    case_study: () => {
      const angles = [
        `📋 ${t}\n\nÉtude de cas — Comment nous avons résolu un recrutement "impossible" :\n\n🏢 Contexte : groupe ultramarin, poste technique vacant depuis 6 mois\n❌ Le problème : 0 candidature qualifiée via les annonces classiques\n\nNotre approche en 3 étapes :\n\n1️⃣ Audit du besoin avec le N+1 (pas juste le RH)\n→ On a découvert que la fiche de poste ne reflétait pas la réalité du terrain\n\n2️⃣ Activation du réseau diaspora\n→ Profils ultramarins en Hexagone, prêts à revenir pour le bon projet\n\n3️⃣ Process accéléré en 2 étapes max\n→ Les bons profils ne patientent pas 3 mois\n\n✅ Résultat : poste pourvu en 22 jours. Candidat validé après période d'essai.\n\nLe recrutement n'est pas compliqué. Il faut juste la bonne méthode.`,
        `📈 ${t}\n\nROI concret d'un partenariat avec Talentys RH :\n\n📊 Situation initiale (notre client, secteur BTP en Martinique) :\n→ 6 mois pour recruter un conducteur de travaux\n→ 2 recrutements ratés en 1 an = coût estimé 80 000€\n→ Projets en retard, équipes sous tension\n\n🎯 Après notre intervention :\n→ Shortlist de 4 profils qualifiés en 3 semaines\n→ Candidat retenu : conducteur de travaux, 8 ans d'expérience, originaire de Martinique\n→ Toujours en poste 1 an après\n\n📉 Économie estimée : 60 000€+ (turn-over évité + projets repris)\n\nLe bon recrutement n'est pas une dépense.\nC'est l'investissement le plus rentable qu'une entreprise puisse faire.`,
      ];
      return pick(angles);
    },
  };

  let post = (generators[category] || generators.hr_news)();

  if (includeCTA) post += pick([
    "\n\n💬 Qu'en pensez-vous ? Partagez votre expérience 👇",
    "\n\n👉 Et vous, quelle est votre expérience sur ce sujet ?",
    "\n\n📩 Envie d'en discuter ? Mon DM est ouvert.",
    "\n\n🔄 Si ce post vous parle, un partage aide à faire avancer la conversation.",
    "\n\n📌 Enregistrez ce post, il pourrait vous être utile.",
  ]);
  if (includeHashtags) post += "\n\n" + (HASHTAG_SETS[category] || HASHTAG_SETS.job_offer).join(" ");
  return post;
};

/* ═══ TALENTYS RH LIVE JOBS (from jobs.talentysrh.com) ═══ */
const TALENTYS_JOBS_URL = "https://jobs.talentysrh.com/jobs";

const TALENTYS_JOBS_CACHE = [
  { id: "7477910", title: "Contrôleur de gestion H/F", location: "Saint-Denis", department: "Finance & Comptabilité", url: "/jobs/7477910-controleur-de-gestion-h-f" },
  { id: "7477637", title: "Comptable unique H/F", location: "Le Lamentin", department: "Finance & Comptabilité", url: "/jobs/7477637-comptable-unique-h-f" },
  { id: "7376622", title: "Assistante de direction H/F", location: "Le Lamentin", department: "Administratif & Direction", url: "/jobs/7376622-assistante-de-direction-h-f" },
  { id: "7376608", title: "Médecin généraliste H/F", location: "Le Lamentin", department: "Médical & Paramédical", url: "/jobs/7376608-medecin-generaliste-h-f" },
  { id: "7290218", title: "Chef de secteur Négoce de matériaux H/F", location: "Le Lamentin", department: "Commerce & ADV", url: "/jobs/7290218-chef-de-secteur-negoce-de-materiaux-h-f" },
  { id: "7290179", title: "Chef de secteur Carrelage et SDB H/F", location: "Le Lamentin", department: "Commerce & ADV", url: "/jobs/7290179-chef-de-secteur-carrelage-et-salle-de-bain-h-f" },
  { id: "7289999", title: "Manager logistique H/F", location: "Le Lamentin", department: "Logistique & Supply Chain", url: "/jobs/7289999-manager-logistique-h-f" },
  { id: "7214300", title: "Assistant technique SAV H/F", location: "Fort-de-France", department: "Commerce & ADV", url: "/jobs/7214300-assistant-technique-sav-h-f" },
  { id: "7183044", title: "Gestionnaire de stock H/F", location: "Fort-de-France", department: "Logistique & Supply Chain", url: "/jobs/7183044-gestionnaire-de-stock-h-f" },
  { id: "7169381", title: "Chargé des applications informatiques H/F", location: "Le Lamentin", department: "IT, Data & Digital", url: "/jobs/7169381-charge-des-applications-informatiques-h-f" },
  { id: "7166228", title: "Responsable administratif et qualité H/F", location: "Cayenne", department: "Support administratif", url: "/jobs/7166228-responsable-administratif-et-qualite-h-f" },
  { id: "7166194", title: "Commercial terrain entreprises et TNS H/F", location: "Cayenne", department: "Développement commercial", url: "/jobs/7166194-commercial-terrain-entreprises-et-tns-h-f" },
  { id: "7158178", title: "Educateur spécialisé H/F", location: "Le Lamentin", department: "Médico-social", url: "/jobs/7158178-educateur-specialise-h-f" },
  { id: "7074795", title: "Consultant(e) en recrutement Freelance", location: "La Réunion", department: "Ressources Humaines", url: "/jobs/7074795-consultant-e-en-recrutement-freelance" },
  { id: "7074704", title: "Consultant(e) en recrutement Freelance", location: "Guadeloupe", department: "Ressources Humaines", url: "/jobs/7074704-consultant-e-en-recrutement-freelance" },
  { id: "7074469", title: "Consultant(e) en recrutement Freelance", location: "Martinique", department: "Ressources Humaines", url: "/jobs/7074469-consultant-e-en-recrutement-freelance" },
  { id: "7061606", title: "Conseiller administratif et commercial H/F", location: "Fort-de-France", department: "Commerce & ADV", url: "/jobs/7061606-conseiller-administratif-et-commercial-h-f" },
  { id: "7046674", title: "Conducteur de travaux courant faible H/F", location: "Fort-de-France", department: "Sécurité & Sûreté", url: "/jobs/7046674-conducteur-de-travaux-courant-faible-h-f" },
  { id: "7046647", title: "Gestionnaire RH H/F", location: "Saint-Denis", department: "Ressources Humaines", url: "/jobs/7046647-gestionnaire-rh-h-f" },
  { id: "7046624", title: "Chargé d'affaires Sécurité Incendie H/F", location: "Baie-Mahault", department: "Développement commercial", url: "/jobs/7046624-charge-d-affaires-systemes-de-securite-incendie-h-f" },
  { id: "7046581", title: "Technicien confirmé en sûreté H/F", location: "Baie-Mahault", department: "Sécurité & Sûreté", url: "/jobs/7046581-technicien-confirme-en-surete-courant-faible-h-f" },
  { id: "7046535", title: "Technicien confirmé courant faible H/F", location: "Le Lamentin", department: "Sécurité & Sûreté", url: "/jobs/7046535-technicien-confirme-courant-faible-h-f" },
  { id: "7046338", title: "Ingénieur commercial Grands Comptes H/F", location: "Le Lamentin", department: "Développement commercial", url: "/jobs/7046338-ingenieur-commercial-grands-comptes-courant-faible-h-f" },
  { id: "7044995", title: "Technico-commercial itinérant H/F", location: "Cayenne", department: "Développement commercial", url: "/jobs/7044995-technico-commercial-itinerant-h-f" },
  { id: "7039415", title: "Commercial terrain H/F", location: "Fort-de-France", department: "Développement commercial", url: "/jobs/7039415-commercial-terrain-h-f" },
  { id: "7039334", title: "Technicien courant faible H/F", location: "Le Lamentin", department: "Sécurité & Sûreté", url: "/jobs/7039334-technicien-courant-faible-h-f" },
  { id: "7039327", title: "Technicien Alarme H/F", location: "Baie-Mahault", department: "Sécurité & Sûreté", url: "/jobs/7039327-technicien-alarme-h-f" },
  { id: "7039313", title: "Technicien Alarme H/F", location: "Cayenne", department: "Sécurité & Sûreté", url: "/jobs/7039313-technicien-alarme-h-f" },
  { id: "7039283", title: "Commercial terrain H/F", location: "Mamoudzou", department: "Développement commercial", url: "/jobs/7039283-commercial-terrain-h-f" },
  { id: "7039198", title: "Gestionnaire de stock H/F", location: "Mamoudzou", department: "Logistique & Supply Chain", url: "/jobs/7039198-gestionnaire-de-stock-h-f" },
  { id: "6996456", title: "Assistant d'agence H/F", location: "Cayenne", department: "Support administratif", url: "/jobs/6996456-assistant-d-agence-h-f" },
  { id: "6993141", title: "Chargé de communication H/F", location: "Fort-de-France", department: "Marketing & Communication", url: "/jobs/6993141-charge-de-communication-et-relation-presse-h-f" },
  { id: "6883507", title: "Chargé de projet infrastructures H/F", location: "Le Lamentin", department: "BTP & Immobilier", url: "/jobs/6883507-charge-de-projet-infrastructures-aeroportuaires-et-vrd" },
  { id: "6878449", title: "Électricien Courant Faible H/F", location: "Fort-de-France", department: "Génie climatique", url: "/jobs/6878449-electricien-courant-faible-h-f" },
  { id: "6878374", title: "Technicien Domotique / Télécom H/F", location: "Fort-de-France", department: "Génie climatique", url: "/jobs/6878374-technicien-domotique-telecom-reseau-h-f" },
  { id: "6877211", title: "Assistant commercial H/F", location: "Cayenne", department: "Commerce & ADV", url: "/jobs/6877211-assistant-commercial-h-f" },
  { id: "6876841", title: "Responsable Entreprises et TNS Assurances", location: "Le Lamentin", department: "Développement commercial", url: "/jobs/6876841-responsable-entreprises-et-tns-assurances" },
  { id: "6826272", title: "Responsable technique CFA H/F", location: "Mamoudzou", department: "Sécurité & Sûreté", url: "/jobs/6826272-responsable-technique-cfa-h-f" },
  { id: "6817651", title: "Electrotechnicien H/F", location: "Saint-Martin", department: "Industrie & Maintenance", url: "/jobs/6817651-electrotechnicien-h-f" },
];

const getTerritory = (location) => {
  if (location.includes("Cayenne")) return { name: "Guyane", adj: "guyanais(e)", adjM: "guyanais", economy: "le secteur aurifère, spatial et forestier", hub: "la capitale guyanaise" };
  if (location.includes("Saint-Denis") || location.includes("Le Port") || location.includes("Saint-Pierre") || location.includes("Saint-Paul")) return { name: "La Réunion", adj: "réunionnais(e)", adjM: "réunionnais", economy: "le tourisme, l'agroalimentaire et les services", hub: "l'île intense" };
  if (location.includes("Mamoudzou")) return { name: "Mayotte", adj: "mahorais(e)", adjM: "mahorais", economy: "le BTP, l'éducation et les services publics", hub: "le 101ème département" };
  if (location.includes("Baie-Mahault") || location.includes("Basse-Terre") || location.includes("Pointe-à-Pitre") || location.includes("Les Abymes")) return { name: "Guadeloupe", adj: "guadeloupéen(ne)", adjM: "guadeloupéen", economy: "le tourisme, l'agriculture et le commerce", hub: "l'archipel papillon" };
  if (location.includes("Saint-Martin")) return { name: "Saint-Martin", adj: "saint-martinois(e)", adjM: "saint-martinois", economy: "le tourisme et le commerce international", hub: "l'île bilingue" };
  return { name: "Martinique", adj: "martiniquais(e)", adjM: "martiniquais", economy: "le rhum, le tourisme et les services", hub: "l'île aux fleurs" };
};

const DEPT_CONTEXT = {
  "Finance & Comptabilité": { skills: ["maîtrise des normes comptables françaises", "rigueur analytique", "gestion fiscale DOM-TOM"], missions: ["piloter la comptabilité générale et auxiliaire", "assurer les clôtures mensuelles et annuelles", "gérer la fiscalité spécifique Outre-Mer (octroi de mer, TVA réduite)"], enjeu: "la fiabilité financière", icon: "📊" },
  "Administratif & Direction": { skills: ["organisation et polyvalence", "maîtrise du Pack Office et ERP", "sens de la confidentialité"], missions: ["assister la direction dans le pilotage opérationnel", "coordonner les agendas et les réunions stratégiques", "gérer les dossiers sensibles et la communication interne"], enjeu: "le bon fonctionnement de la direction", icon: "🏛️" },
  "Commerce & ADV": { skills: ["fibre commerciale terrain", "maîtrise du cycle de vente B2B", "connaissance du marché local"], missions: ["développer et fidéliser un portefeuille clients", "négocier les contrats et assurer le suivi commercial", "atteindre les objectifs de CA sur votre secteur"], enjeu: "la croissance commerciale", icon: "🤝" },
  "Développement commercial": { skills: ["prospection B2B/B2C", "négociation complexe", "stratégie de développement territorial"], missions: ["conquérir de nouveaux marchés sur le territoire", "construire des partenariats stratégiques durables", "piloter la performance commerciale et les KPIs"], enjeu: "l'expansion de l'activité", icon: "📈" },
  "Logistique & Supply Chain": { skills: ["gestion de flux et d'entrepôt", "maîtrise des outils WMS/ERP", "optimisation des coûts logistiques"], missions: ["optimiser la chaîne d'approvisionnement insulaire", "gérer les stocks et les flux import/export", "coordonner les transporteurs et transitaires"], enjeu: "la fluidité de la supply chain insulaire", icon: "🚛" },
  "Ressources Humaines": { skills: ["droit social et conventions collectives", "gestion des talents et GPEC", "maîtrise de la paie et des SIRH"], missions: ["piloter la politique RH et accompagner les managers", "gérer le recrutement et l'intégration des collaborateurs", "assurer la conformité sociale et le dialogue social"], enjeu: "le capital humain", icon: "👥" },
  "IT, Data & Digital": { skills: ["architecture SI et intégration d'applications", "gestion de projets digitaux", "cybersécurité et RGPD"], missions: ["piloter le système d'information et les applications métier", "accompagner la transformation digitale de l'entreprise", "assurer la sécurité et la disponibilité des systèmes"], enjeu: "la transformation digitale", icon: "💻" },
  "Marketing & Communication": { skills: ["stratégie de communication multicanale", "création de contenu et branding", "gestion des réseaux sociaux et RP"], missions: ["déployer la stratégie de communication locale", "gérer les relations presse et les événements", "piloter la présence digitale et l'image de marque"], enjeu: "la visibilité et la notoriété", icon: "📣" },
  "Médical & Paramédical": { skills: ["expertise clinique et diagnostic", "sens du patient et éthique médicale", "connaissance du système de santé ultramarin"], missions: ["assurer les consultations et le suivi des patients", "participer à la permanence des soins sur le territoire", "contribuer à l'offre de santé locale"], enjeu: "l'accès aux soins en Outre-Mer", icon: "🏥" },
  "Médico-social": { skills: ["accompagnement éducatif spécialisé", "travail en équipe pluridisciplinaire", "connaissance des dispositifs sociaux"], missions: ["accompagner les publics en situation de vulnérabilité", "concevoir et animer des projets éducatifs adaptés", "travailler en réseau avec les partenaires institutionnels"], enjeu: "l'inclusion et l'accompagnement social", icon: "🤲" },
  "Sécurité & Sûreté": { skills: ["expertise courant faible et systèmes de sécurité", "habilitations électriques et certifications", "gestion de projets techniques"], missions: ["installer et maintenir les systèmes de sécurité (alarme, vidéo, contrôle d'accès)", "assurer les études techniques et le chiffrage", "piloter les chantiers et garantir la qualité"], enjeu: "la sécurité des biens et des personnes", icon: "🔒" },
  "BTP & Immobilier": { skills: ["pilotage de chantiers et planification", "maîtrise des normes et réglementations BTP", "management d'équipes terrain"], missions: ["superviser l'avancement des projets de construction", "coordonner les sous-traitants et les bureaux d'études", "garantir le respect des délais, coûts et qualité"], enjeu: "le développement des infrastructures", icon: "🏗️" },
  "Génie climatique": { skills: ["expertise en courants faibles et domotique", "maîtrise des réseaux télécoms", "habilitations électriques"], missions: ["installer et configurer les équipements domotiques et télécoms", "assurer la maintenance préventive et corrective", "réaliser les diagnostics techniques sur site"], enjeu: "le confort et la connectivité", icon: "⚡" },
  "Industrie & Maintenance": { skills: ["maintenance industrielle préventive et corrective", "lecture de schémas électriques", "diagnostic de pannes complexes"], missions: ["assurer le bon fonctionnement des installations techniques", "intervenir en dépannage et maintenance planifiée", "contribuer à l'amélioration continue des process"], enjeu: "la performance industrielle", icon: "🔧" },
  "Support administratif": { skills: ["polyvalence administrative", "maîtrise des outils bureautiques", "rigueur et organisation"], missions: ["assurer la gestion administrative quotidienne", "traiter les dossiers clients et fournisseurs", "contribuer au reporting et au suivi d'activité"], enjeu: "l'efficacité administrative", icon: "📋" },
};

const getDeptCtx = (dept) => DEPT_CONTEXT[dept] || { skills: ["expertise métier reconnue", "autonomie et adaptabilité", "connaissance du tissu économique local"], missions: ["contribuer activement au développement de l'activité", "apporter votre expertise au sein d'une équipe engagée", "participer aux projets structurants de l'entreprise"], enjeu: "la réussite du projet", icon: "💼" };

const generateJobPost = (job, tone, includeHashtags, includeCTA) => {
  const t = getTerritory(job.location);
  const d = getDeptCtx(job.department);
  const link = `${TALENTYS_JOBS_URL.replace("/jobs","")}${job.url}`;
  const shortTitle = job.title.replace(" H/F", "").replace("(e)", "e");
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const templates = {
    professional: [
      `${d.icon} ${job.title} — ${job.location}\n\nNous accompagnons un acteur reconnu du secteur ${job.department} en ${t.name} dans le recrutement de son/sa ${shortTitle}.\n\nLes enjeux du poste :\n→ ${d.missions[0]}\n→ ${d.missions[1]}\n→ ${d.missions[2]}\n\nProfil recherché :\n→ ${d.skills[0]}\n→ ${d.skills[1]}\n→ ${d.skills[2]}\n\n📍 Poste basé à ${job.location} (${t.name})\n\n👉 Candidatez ici : ${link}\n📩 Ou contactez-moi en DM pour un échange confidentiel.`,
      `📋 Recrutement en cours — ${shortTitle}\n📍 ${job.location}, ${t.name}\n\nNotre client, entreprise de référence en ${job.department}, recherche un profil capable de prendre en charge ${d.enjeu} au sein de sa structure.\n\nVos missions principales :\n✅ ${d.missions[0]}\n✅ ${d.missions[1]}\n✅ ${d.missions[2]}\n\nCe que cette entreprise offre :\n→ Un poste stratégique dans une structure solide\n→ Un environnement professionnel ${t.adjM}\n→ Des perspectives d'évolution réelles\n\n🎯 Postulez : ${link}`,
      `🎯 ${shortTitle} — ${t.name}\n\nMission confidentielle pour un groupe implanté à ${job.location}.\n\nContexte :\nDans un environnement ${job.department} en pleine structuration, notre client recherche un(e) ${shortTitle} pour sécuriser ${d.enjeu}.\n\nResponsabilités clés :\n→ ${d.missions[0]}\n→ ${d.missions[1]}\n\nAtouts attendus :\n→ ${d.skills[0]}\n→ ${d.skills[1]}\n→ Connaissance du contexte ${t.adjM} (un plus apprécié)\n\n📩 Pour en savoir plus : ${link}\nOu échangeons en privé, en toute discrétion.`,
    ],
    inspiring: [
      `✨ Et si votre prochain chapitre professionnel s'écrivait en ${t.name} ?\n\nNous recherchons un(e) ${shortTitle} pour une entreprise qui croit en ses talents à ${job.location}.\n\nCe poste, c'est l'opportunité de :\n→ ${d.missions[0]}\n→ ${d.missions[1]}\n→ Évoluer dans un cadre de vie exceptionnel, ${t.hub}\n\nVous apportez :\n→ ${d.skills[0]}\n→ ${d.skills[1]}\n→ L'envie de contribuer à ${d.enjeu} sur un territoire en plein essor\n\n🌟 Cette offre vous inspire ? ${link}\n\nParfois, il suffit d'un clic pour changer de trajectoire.`,
      `🌴 Imaginez : exercer votre métier de ${shortTitle} depuis ${t.hub}.\n\nC'est le quotidien que propose notre client à ${job.location}.\n\nCe qui rend ce poste spécial :\n→ Un rôle central dans ${d.enjeu}\n→ ${d.missions[0]}\n→ Un cadre de vie où qualité professionnelle rime avec qualité de vie\n\nProfil souhaité :\n→ ${d.skills[0]}\n→ ${d.skills[1]}\n\nLes meilleurs talents ultramarins méritent les meilleures opportunités.\n\n👉 ${link}`,
    ],
    storytelling: [
      `📖 "On ne trouvera jamais ce profil ici."\n\nC'est ce que notre client à ${job.location} pensait pour son poste de ${shortTitle}.\n\n${t.name}, bassin de talents restreint ? Pas si vite.\n\nLe contexte :\n→ Un poste clé en ${job.department}\n→ Des missions à fort impact : ${d.missions[0].toLowerCase()}, ${d.missions[1].toLowerCase()}\n→ Besoin d'un profil avec ${d.skills[0].toLowerCase()}\n\nEt devinez quoi ? Ce talent existe. Peut-être même dans votre réseau.\n\n📩 Toutes les infos : ${link}\n\nTaguez quelqu'un qui pourrait être ce talent 👇`,
      `📝 Petite histoire vraie :\n\nUn dirigeant m'appelle depuis ${job.location}. "Marco, j'ai un poste de ${shortTitle} ouvert depuis des mois. Je n'y arrive pas."\n\nSon besoin : quelqu'un capable de ${d.missions[0].toLowerCase()} et de ${d.missions[1].toLowerCase()}.\n\nSon erreur ? Chercher seul, sans activer le bon réseau.\n\nSi vous êtes ${shortTitle} avec ${d.skills[0].toLowerCase()} et que ${t.name} vous attire :\n\n👉 ${link}\n\nOu parlons-en directement. En toute confidentialité.`,
    ],
    educational: [
      `💡 Zoom métier : ${shortTitle}\n\nOn me demande souvent : "C'est quoi concrètement ce poste ?"\n\nVoici les 3 missions principales d'un(e) ${shortTitle} :\n\n1️⃣ ${d.missions[0]}\n2️⃣ ${d.missions[1]}\n3️⃣ ${d.missions[2]}\n\nLes compétences clés :\n→ ${d.skills[0]}\n→ ${d.skills[1]}\n\nEt justement, ce profil est recherché à ${job.location} (${t.name}) !\n\n📍 Offre complète : ${link}\n\nVous vous reconnaissez dans cette description ? Parlons-en.`,
    ],
    casual: [
      `☕ Entre deux entretiens ce matin, je partage cette pépite :\n\nUn poste de ${shortTitle} à ${job.location}, dans une boîte solide du secteur ${job.department}.\n\nConcrètement vous allez :\n→ ${d.missions[0]}\n→ ${d.missions[1]}\n\nOn cherche quelqu'un avec ${d.skills[0].toLowerCase()} et ${d.skills[1].toLowerCase()}.\n\nSi ${t.name} est votre terrain de jeu, c'est le moment.\n\n🔗 ${link}`,
    ],
    engaging: [
      `⚡ Attention, profil recherché d'urgence en ${t.name} !\n\n${shortTitle} — ${job.location}\n\nPourquoi ce poste ne restera pas longtemps en ligne :\n→ Secteur ${job.department} en tension\n→ Missions stratégiques : ${d.missions[0].toLowerCase()}\n→ Entreprise qui investit dans ses collaborateurs\n\nVous avez ${d.skills[0].toLowerCase()} et ${d.skills[1].toLowerCase()} ?\n\n🚀 Foncez : ${link}\n\nEt si ce n'est pas pour vous, taguez la bonne personne 👇\nUn partage peut changer une carrière.`,
    ],
  };

  let post = pick(templates[tone] || templates.professional);
  if (includeCTA) post += pick([
    "\n\n🔄 Partagez cette offre — cela ne prend que 2 secondes et peut changer une carrière !",
    "\n\n💬 Vous connaissez le profil idéal ? Taguez-le en commentaire !",
    "\n\n📩 Une question sur ce poste ? Mon DM est ouvert.",
    "\n\n👉 Partagez dans votre réseau — le bon profil est peut-être à un clic.",
  ]);
  if (includeHashtags) {
    const deptTag = job.department.split(" ")[0].replace(/[&é]/g, "");
    post += `\n\n#Recrutement #${t.name.replace(/[\s']/g,"")} #${deptTag} #Emploi #TalentysRH #Outremer #${shortTitle.split(" ")[0]}`;
  }
  return post;
};

/* ═══ PEXELS SAMPLE IMAGES (simulated) ═══ */
const makePexelsSvg = (label, colors, icon) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <text x="200" y="130" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif" opacity="0.9">${icon}</text>
    <text x="200" y="175" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="sans-serif" opacity="0.95">${label}</text>
    <text x="200" y="200" text-anchor="middle" fill="white" font-size="11" font-family="sans-serif" opacity="0.6">Pexels · Photo libre de droits</text>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
};

const PEXELS_RESULTS = {
  recrutement: [
    { id: 1, src: makePexelsSvg("Réunion d'équipe", ["#6366f1","#8b5cf6"], "👥"), alt: "Réunion d'équipe", photographer: "fauxels" },
    { id: 2, src: makePexelsSvg("Collaboration", ["#3b82f6","#06b6d4"], "🤝"), alt: "Collaboration", photographer: "fauxels" },
    { id: 3, src: makePexelsSvg("Bureau moderne", ["#10b981","#059669"], "🏢"), alt: "Bureau moderne", photographer: "fauxels" },
    { id: 4, src: makePexelsSvg("Succès d'équipe", ["#f59e0b","#f97316"], "🎉"), alt: "Succès d'équipe", photographer: "fauxels" },
    { id: 5, src: makePexelsSvg("Discussion pro", ["#ec4899","#be185d"], "💬"), alt: "Discussion professionnelle", photographer: "fauxels" },
    { id: 6, src: makePexelsSvg("Poignée de main", ["#8b5cf6","#6366f1"], "🤝"), alt: "Poignée de main", photographer: "fauxels" },
    { id: 7, src: makePexelsSvg("Recrutement", ["#ef4444","#f97316"], "🎯"), alt: "Recrutement", photographer: "fauxels" },
    { id: 8, src: makePexelsSvg("Entretien", ["#14b8a6","#0ea5e9"], "🎤"), alt: "Entretien d'embauche", photographer: "fauxels" },
    { id: 9, src: makePexelsSvg("Leadership", ["#a855f7","#ec4899"], "⭐"), alt: "Leadership", photographer: "fauxels" },
    { id: 10, src: makePexelsSvg("Outre-Mer", ["#0ea5e9","#06b6d4"], "🌴"), alt: "Outre-Mer", photographer: "fauxels" },
    { id: 11, src: makePexelsSvg("Innovation RH", ["#6366f1","#3b82f6"], "💡"), alt: "Innovation RH", photographer: "fauxels" },
    { id: 12, src: makePexelsSvg("Croissance", ["#10b981","#34d399"], "📈"), alt: "Croissance", photographer: "fauxels" },
  ],
};

/* ═══ PERFORMANCE DATA (simulated) ═══ */
const PERF_DATA = [
    { day: "Lun", impressions: 1250, engagement: 4.2, clicks: 52 },
    { day: "Mar", impressions: 1480, engagement: 5.1, clicks: 75 },
    { day: "Mer", impressions: 980, engagement: 3.8, clicks: 37 },
    { day: "Jeu", impressions: 2100, engagement: 6.3, clicks: 132 },
    { day: "Ven", impressions: 1750, engagement: 5.7, clicks: 99 },
    { day: "Sam", impressions: 620, engagement: 2.9, clicks: 18 },
    { day: "Dim", impressions: 430, engagement: 2.1, clicks: 9 },
    { day: "Lun", impressions: 1580, engagement: 4.8, clicks: 63 },
    { day: "Mar", impressions: 1920, engagement: 5.5, clicks: 108 },
  ];

/* ═══ SUGGESTION TOPICS BANK ═══ */
const SUGGESTION_TOPICS = {
  job_offer: [
    { title: "Offre d'emploi attractive", hint: "Publiez une offre en cours — format accroche + 3 points forts + CTA" },
    { title: "Recherche profil spécifique", hint: "Mettez en avant un talent rare recherché pour votre client" },
    { title: "Poste ouvert en urgence", hint: "Urgence = engagement — signalez un besoin immédiat" },
  ],
  promo_services: [
    { title: "Pourquoi externaliser son recrutement", hint: "Éduquez sur le RPO et le gain de temps vs coût d'un recrutement raté" },
    { title: "Chiffres clés Talentys RH", hint: "Partagez vos résultats : taux de rétention, délais, placements" },
    { title: "Problème / Solution recrutement", hint: "Format avant/après : le recrutement seul vs avec Talentys" },
  ],
  prospection: [
    { title: "Combien coûte un recrutement raté ?", hint: "Interpellez les dirigeants avec des chiffres concrets (30-150k€)" },
    { title: "5 erreurs de recrutement en Outre-Mer", hint: "Conseils d'expert qui positionnent Talentys comme solution" },
    { title: "Audit RH gratuit", hint: "Offre découverte pour générer des leads qualifiés" },
  ],
  employer_brand: [
    { title: "Marque employeur en Outre-Mer", hint: "5 leviers sous-estimés pour attirer les talents locaux" },
    { title: "Erreurs qui font fuir les candidats", hint: "Process trop long, annonce générique, pas de présence LinkedIn" },
    { title: "Onboarding réussi en Outre-Mer", hint: "Les 90 premiers jours qui font tout pour la rétention" },
  ],
  hr_news: [
    { title: "Tendance RH de la semaine", hint: "IA, télétravail, Gen Z — analysez l'impact pour l'Outre-Mer" },
    { title: "Conseil RH actionnable", hint: "3 actions concrètes sur un sujet RH précis" },
    { title: "Chiffres du marché de l'emploi", hint: "Stats récentes + votre analyse terrain" },
  ],
  consultant: [
    { title: "Coulisses du métier de recruteur", hint: "Une semaine type, un moment marquant, une anecdote" },
    { title: "Ce que j'ai appris cette semaine", hint: "Leçon de terrain, partage authentique" },
    { title: "La réalité du recrutement en Outre-Mer", hint: "Ce que les gens ne voient pas derrière un placement réussi" },
  ],
  outremer: [
    { title: "Actualité économique d'un territoire", hint: "Martinique, Guadeloupe, Guyane — fait marquant + impact emploi" },
    { title: "Mobilité professionnelle DOM", hint: "Conseils pour ceux qui veulent travailler en Outre-Mer" },
    { title: "Secteurs qui recrutent localement", hint: "BTP, santé, tech, tourisme — focus territoire" },
  ],
  testimony: [
    { title: "Success story candidat", hint: "Parcours d'un candidat placé : avant / pendant / après" },
    { title: "Retour client satisfait", hint: "Citation + contexte + résultat concret" },
    { title: "Mobilité réussie", hint: "Histoire de quelqu'un qui a changé de territoire avec succès" },
  ],
  motivation: [
    { title: "Leçon d'entrepreneuriat", hint: "Ce que diriger un cabinet en Outre-Mer vous a appris" },
    { title: "Citation + réflexion personnelle", hint: "Une phrase qui résonne avec votre quotidien de recruteur" },
    { title: "Pourquoi j'aime ce métier", hint: "Post authentique et inspirant sur votre vocation" },
  ],
  case_study: [
    { title: "Étude de cas recrutement", hint: "Contexte → Approche → Résultat — avec métriques" },
    { title: "ROI d'un recrutement réussi", hint: "Chiffrez l'impact business d'un bon placement" },
    { title: "Mission complexe résolue", hint: "Le recrutement le plus difficile et comment vous l'avez géré" },
  ],
};

const BEST_DAYS = [2, 3, 4];
const POSTS_PER_WEEK = 3;

const getSuggestions = (scheduledPosts, contentMix, now) => {
  const upcoming = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i <= 14 && upcoming.length < 6; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (!BEST_DAYS.includes(dow)) continue;
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hasPost = scheduledPosts.some(p => p.date === ds);
    upcoming.push({ date: d, dateStr: ds, dayName: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dow], hasPost });
  }
  const ranked = [...contentMix].sort((a, b) => (b.target - b.percent) - (a.target - a.percent));
  const suggestions = [];
  let catIdx = 0;
  for (const slot of upcoming) {
    if (slot.hasPost) continue;
    const cat = ranked[catIdx % ranked.length];
    const topics = SUGGESTION_TOPICS[cat.id] || [];
    const weekNum = Math.floor((slot.date.getTime() - today.getTime()) / (7 * 86400000));
    const topic = topics.length > 0 ? topics[(catIdx + weekNum) % topics.length] : { title: cat.label, hint: "" };
    suggestions.push({ date: slot.date, dateStr: slot.dateStr, dayName: slot.dayName, category: cat, topic, time: "09:00" });
    catIdx++;
  }
  return suggestions;
};

/* ════════════════════════════════════════════════════════════════════
   THEMES
   ════════════════════════════════════════════════════════════════════ */
const THEMES = {
  dark: {
    id: "dark",
    bg: "#08090d",
    bgSurface: "#0e1018",
    bgCard: "#12141e",
    bgCardHover: "#181b28",
    bgElevated: "#1a1d2e",
    bgInput: "#0c0d14",
    border: "#1e2035",
    borderLight: "#282b45",
    borderFocus: "#6366f1",
    text: "#eaeaf0",
    textSecondary: "#9496b0",
    textMuted: "#5c5f7e",
    accent: "#6366f1",
    accentLight: "#818cf8",
    accentBg: "rgba(99,102,241,0.10)",
    accentBgHover: "rgba(99,102,241,0.18)",
    green: "#22c55e",
    greenBg: "rgba(34,197,94,0.10)",
    amber: "#f59e0b",
    amberBg: "rgba(245,158,11,0.10)",
    red: "#ef4444",
    redBg: "rgba(239,68,68,0.10)",
    pink: "#ec4899",
    pinkBg: "rgba(236,72,153,0.10)",
    cyan: "#22d3ee",
    cyanBg: "rgba(34,211,238,0.10)",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
    gradientSubtle: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 50%, rgba(236,72,153,0.08) 100%)",
    glassBorder: "rgba(255,255,255,0.06)",
    shadow: "0 4px 24px rgba(0,0,0,0.3)",
    shadowLg: "0 8px 48px rgba(0,0,0,0.5)",
    calendarPickerFilter: "invert(0.7)",
  },
  light: {
    id: "light",
    bg: "#f5f7fb",
    bgSurface: "#ffffff",
    bgCard: "#ffffff",
    bgCardHover: "#f0f2f8",
    bgElevated: "#f3f4f9",
    bgInput: "#f8f9fc",
    border: "#e2e5f0",
    borderLight: "#d0d4e4",
    borderFocus: "#6366f1",
    text: "#1a1d2e",
    textSecondary: "#5c5f7e",
    textMuted: "#9496b0",
    accent: "#6366f1",
    accentLight: "#4f46e5",
    accentBg: "rgba(99,102,241,0.08)",
    accentBgHover: "rgba(99,102,241,0.14)",
    green: "#16a34a",
    greenBg: "rgba(22,163,74,0.08)",
    amber: "#d97706",
    amberBg: "rgba(217,119,6,0.08)",
    red: "#dc2626",
    redBg: "rgba(220,38,38,0.08)",
    pink: "#db2777",
    pinkBg: "rgba(219,39,119,0.08)",
    cyan: "#0891b2",
    cyanBg: "rgba(8,145,178,0.08)",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
    gradientSubtle: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.05) 50%, rgba(236,72,153,0.04) 100%)",
    glassBorder: "rgba(0,0,0,0.06)",
    shadow: "0 2px 12px rgba(0,0,0,0.06)",
    shadowLg: "0 8px 32px rgba(0,0,0,0.10)",
    calendarPickerFilter: "none",
  },
};

const buildCSS = (t) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.15); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.3); } }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: ${t.borderLight}; }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator { filter: ${t.calendarPickerFilter}; cursor: pointer; }
  select option { background: ${t.bgCard}; color: ${t.text}; }
  ::selection { background: rgba(99,102,241,0.3); }
`;

/* ════════════════════════════════════════════════════════════════════
   THEME CONTEXT
   ════════════════════════════════════════════════════════════════════ */
const ThemeCtx = createContext(THEMES.light);
const useTheme = () => useContext(ThemeCtx);

/* ════════════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ════════════════════════════════════════════════════════════════════ */
const Modal = ({ title, children, onClose, theme }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, animation: "fadeIn 0.2s ease" }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: theme.bgCard, borderRadius: 18, width: "100%", maxWidth: 540, border: `1px solid ${theme.border}`, maxHeight: "90vh", overflow: "auto", boxShadow: theme.shadowLg, animation: "slideUp 0.3s ease" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: theme.bgElevated, border: "none", borderRadius: 8, padding: 5, cursor: "pointer", color: theme.textMuted, display: "flex" }}><X size={15} /></button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

const Btn = ({ children, variant = "primary", onClick, style: s = {}, disabled = false, size = "md" }) => {
  const T = useTheme();
  const [hov, setHov] = useState(false);
  const sz = { sm: { padding: "7px 12px", fontSize: 12, borderRadius: 8, gap: 5 }, md: { padding: "10px 18px", fontSize: 13, borderRadius: 10, gap: 7 }, lg: { padding: "14px 24px", fontSize: 15, borderRadius: 12, gap: 8 } }[size];
  const vars = {
    primary: { background: hov ? T.accentLight : T.accent, color: "#fff", border: "none", boxShadow: hov ? "0 4px 20px rgba(99,102,241,0.4)" : "0 2px 10px rgba(99,102,241,0.2)" },
    gradient: { background: T.gradient, color: "#fff", border: "none", boxShadow: hov ? "0 4px 30px rgba(99,102,241,0.5)" : "0 2px 15px rgba(99,102,241,0.3)", transform: hov ? "translateY(-1px)" : "none" },
    secondary: { background: hov ? T.bgCardHover : T.bgElevated, color: T.text, border: `1px solid ${T.border}` },
    ghost: { background: hov ? T.accentBg : "transparent", color: hov ? T.accentLight : T.textSecondary, border: "none" },
    danger: { background: hov ? "rgba(239,68,68,0.18)" : T.redBg, color: T.red, border: "none" },
    success: { background: hov ? "rgba(34,197,94,0.18)" : T.greenBg, color: T.green, border: "none" },
  }[variant];
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...vars, ...sz, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", transition: "all 0.2s cubic-bezier(.4,0,.2,1)", opacity: disabled ? 0.5 : 1, fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em", whiteSpace: "nowrap", ...s }}>
      {children}
    </button>
  );
};

const ProgressRing = ({ progress, size = 60, stroke = 5, color }) => {
  const T = useTheme();
  const c = color || T.accent;
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (Math.min(progress, 100) / 100) * circ}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
};

const LinkedInPreview = ({ content, author = "Consultant Talentys RH", imageUrl }) => {
  const T = useTheme();
  return (
  <div style={{ background: "#1b1f23", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
    <div style={{ padding: "16px 16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{author.charAt(0)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#e6edf3" }}>{author}</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>Consultant Recrutement · Talentys RH</div>
          <div style={{ fontSize: 11, color: "#6e7681", display: "flex", alignItems: "center", gap: 4 }}>Maintenant · <Globe size={11} /></div>
        </div>
        <MoreHorizontal size={20} color="#8b949e" />
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "#e6edf3", whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: 240, overflow: "auto", paddingBottom: 12 }}>
        {content || "Votre publication apparaîtra ici..."}
      </div>
    </div>
    {imageUrl && <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}><img src={imageUrl} alt="Publication" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} /></div>}
    <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 8px", fontSize: 12, color: "#8b949e" }}>
        <span>👍 ❤️ 24</span><span>8 commentaires · 3 partages</span>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-around", paddingTop: 4 }}>
        {[{ icon: ThumbsUp, label: "J'aime" }, { icon: MessageSquare, label: "Commenter" }, { icon: RefreshCw, label: "Partager" }, { icon: Send, label: "Envoyer" }].map(({ icon: Icon, label }) => (
          <button key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 8px", background: "none", border: "none", color: "#8b949e", cursor: "pointer", borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif" }}><Icon size={16} /> {label}</button>
        ))}
      </div>
    </div>
  </div>
);};

/* ════════════════════════════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   LOGIN PAGE (standalone, before main app)
   ════════════════════════════════════════════════════════════════════ */
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [changePwd, setChangePwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await API.login(email, password);
      if (data.mustChangePassword) {
        setChangePwd(true); setLoading(false);
      } else {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message); setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) { setError("6 caractères minimum"); return; }
    if (newPwd !== newPwdConfirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setError(""); setLoading(true);
    try {
      await API.changePassword(newPwd);
      const me = await API.getMe();
      onLogin(me.user);
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fb 0%, #e8ecf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, -apple-system, sans-serif", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 30px rgba(99,102,241,0.3)" }}>
            <Zap size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1d2e", margin: "0 0 4px", letterSpacing: "-0.04em" }}>PostFlow</h1>
          <p style={{ color: "#5c5f7e", fontSize: 14 }}>by Talentys RH</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e2e5f0" }}>
          {!changePwd ? (
            <form onSubmit={handleLogin}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1d2e", margin: "0 0 4px" }}>Connexion</h2>
              <p style={{ color: "#5c5f7e", fontSize: 13, margin: "0 0 24px" }}>Entrez vos identifiants pour accéder à PostFlow</p>

              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5c5f7e", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com"
                style={{ width: "100%", padding: "12px 14px", background: "#f8f9fc", border: "1px solid #e2e5f0", borderRadius: 10, fontSize: 14, color: "#1a1d2e", marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "Inter, sans-serif" }} />

              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5c5f7e", marginBottom: 6 }}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", background: "#f8f9fc", border: "1px solid #e2e5f0", borderRadius: 10, fontSize: 14, color: "#1a1d2e", marginBottom: 24, boxSizing: "border-box", outline: "none", fontFamily: "Inter, sans-serif" }} />

              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 15px rgba(99,102,241,0.3)", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1d2e", margin: "0 0 4px" }}>Nouveau mot de passe</h2>
              <p style={{ color: "#5c5f7e", fontSize: 13, margin: "0 0 24px" }}>Choisissez votre mot de passe personnel (6 caractères min.)</p>

              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5c5f7e", marginBottom: 6 }}>Nouveau mot de passe</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", background: "#f8f9fc", border: "1px solid #e2e5f0", borderRadius: 10, fontSize: 14, color: "#1a1d2e", marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "Inter, sans-serif" }} />

              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5c5f7e", marginBottom: 6 }}>Confirmer</label>
              <input type="password" value={newPwdConfirm} onChange={e => setNewPwdConfirm(e.target.value)} required placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", background: "#f8f9fc", border: "1px solid #e2e5f0", borderRadius: 10, fontSize: 14, color: "#1a1d2e", marginBottom: 24, boxSizing: "border-box", outline: "none", fontFamily: "Inter, sans-serif" }} />

              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 15px rgba(99,102,241,0.3)", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Enregistrement..." : "Valider et accéder à PostFlow"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    API.getMe().then(data => {
      if (data.authenticated) setAuthUser(data.user);
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fb", fontFamily: "Inter, sans-serif" }}>
      <Loader size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!authUser) return <LoginPage onLogin={setAuthUser} />;

  return <AppMain authUser={authUser} onLogout={() => { API.logout(); setAuthUser(null); }} />;
}

function AppMain({ authUser, onLogout }) {
  const [themeMode, setThemeMode] = useState(() => localStorage?.getItem?.("postflow-theme") || "light");
  const T = THEMES[themeMode] || THEMES.light;
  const globalCSS = buildCSS(T);
  const toggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    try { localStorage?.setItem?.("postflow-theme", next); } catch(e) {}
  };
  const [tab, setTab] = useState("dashboard");
  const [scheduledPosts, setScheduledPosts] = useState([

        {
            "id": 1,
            "content": "🚀 Talentys RH recrute pour un poste de Directeur Commercial en Martinique !\n\nNotre client, leader dans son secteur, recherche un profil senior.\n\n→ 10+ ans d’expérience\n→ Leadership éprouvé\n→ Connaissance du marché local\n\n📩 Contactez-moi !\n\n#Recrutement #Martinique #Emploi",
            "date": "2026-03-28",
            "time": "09:00",
            "category": "job_offer",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 2,
            "content": "💡 Le conseil RH de la semaine :\n\nArrêtez de recruter uniquement sur le CV.\n\nLes soft skills font la différence :\n\n1️⃣ Adaptabilité\n2️⃣ Communication\n3️⃣ Esprit d’équipe\n\n📌 Enregistrez ce post !\n\n#RH #ConseilRH #Recrutement",
            "date": "2026-03-30",
            "time": "12:00",
            "category": "hr_news",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 3,
            "content": "🌟 Success Story !\n\nIl y a 3 mois, Julie cherchait un nouveau challenge en Guadeloupe.\n\nAujourd’hui, elle est Responsable RH chez un grand groupe local !\n\n💪 La clé : un accompagnement personnalisé.\n\n#Réussite #Talents #Outremer",
            "date": "2026-04-02",
            "time": "08:30",
            "category": "testimony",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 4,
            "content": "🌴 L’économie guadeloupéenne en 2026 : les secteurs qui recrutent !\n\n📊 +12% de créations de postes dans le BTP\n📈 Le tourisme en plein boom\n🎯 La tech locale qui émerge\n\nLes opportunités sont là !\n\n#Guadeloupe #Emploi #Outremer",
            "date": "2026-04-05",
            "time": "10:00",
            "category": "outremer",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 5,
            "content": "☕ Ma journée type de consultant en recrutement :\n\n8h — Café + revue des candidatures\n9h — Entretien candidat\n10h30 — Brief client\n12h — Déjeuner réseau\n14h — Sourcing intensif\n16h — Suivi missions\n17h — Veille marché\n\nEt vous, à quoi ressemble votre journée ? 😄\n\n#ConsultantRH #VieDeRecruteur",
            "date": "2026-04-07",
            "time": "08:00",
            "category": "consultant",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 6,
            "content": "❌ Le problème :\nVotre dernier recrutement a pris 4 mois. Le candidat est parti au bout de 3.\n\n✅ La solution Talentys RH :\n\n📋 Diagnostic du besoin réel\n🔎 Sourcing ciblé via notre réseau local\n🎯 Shortlist qualifiée en 3 semaines max\n🤝 Accompagnement jusqu’à la fin de période d’essai\n\nRésultat ? 92% de nos placements encore en poste après 1 an.\n\n📩 Discutons de votre prochain recrutement.\n\n#Recrutement #RPO #TalentysRH #Outremer",
            "date": "2026-03-29",
            "time": "10:00",
            "category": "promo_services",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 7,
            "content": "👔 Dirigeant en Outre-Mer, cette question est pour vous :\n\nCombien vous coûte un recrutement raté ?\n\n💸 Coût direct : 30 000€ à 150 000€\n⏳ Coût indirect : temps perdu, démotivation\n😰 Coût caché : turn-over en chaîne\n\nUn cabinet spécialisé réduit ce risque de 70%.\n\n📩 Premier échange offert — écrivez-moi en DM\n\n#Dirigeant #Recrutement #ROI #TalentysRH",
            "date": "2026-04-03",
            "time": "09:00",
            "category": "prospection",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        },
        {
            "id": 8,
            "content": "📋 ÉTUDE DE CAS — Recrutement DAF en Martinique\n\n🏢 Client : Groupe BTP, 200 salariés\n⏱️ Délai : 18 jours\n✅ Candidat toujours en poste 10 mois après\n\nNotre approche :\n1️⃣ Audit du besoin avec le DG\n2️⃣ Sourcing ciblé réseau local + national\n3️⃣ Shortlist de 4 profils qualifiés\n4️⃣ Accompagnement intégration 3 mois\n\nROI estimé : 8× l’investissement initial\n\n📞 Un poste stratégique à pourvoir ?\n\n#CasClient #Recrutement #TalentysRH #Martinique",
            "date": "2026-04-09",
            "time": "08:30",
            "category": "case_study",
            "status": "scheduled",
            "author": "Marco B.",
            "imageUrl": ""
        }
    ]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2));
  const [gen, setGen] = useState({ topic: "", tone: "professional", category: "job_offer", includeHashtags: true, includeCTA: true, content: "", isGenerating: false, selectedImage: null, selectedJob: null });
  const [talentysJobs, setTalentysJobs] = useState(TALENTYS_JOBS_CACHE);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [showModal, setShowModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [schedForm, setSchedForm] = useState({ date: "", time: "09:00", author: "Marco B." });
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [linkedinProfile, setLinkedinProfile] = useState({ name: "", picture: "" });
  const [pexelsSearch, setPexelsSearch] = useState("");
  const pexelsInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pexelsResults, setPexelsResults] = useState([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsPage, setPexelsPage] = useState(1);
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0);
  const [pexelsLoadingMore, setPexelsLoadingMore] = useState(false);
  const [notif, setNotif] = useState(null);
  const [objectives, setObjectives] = useState({ weeklyTarget: 3, monthlyTarget: 12 });
  const [filterCat, setFilterCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [perfRange, setPerfRange] = useState("month");

  const showNotification = useCallback((msg, type = "success") => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); }, []);

  /* ── COMPUTED ── */
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const thisWeekPosts = scheduledPosts.filter(p => { const d = new Date(p.date); return d >= weekStart && d <= weekEnd; });
  const thisMonthPosts = scheduledPosts.filter(p => { const d = new Date(p.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const weekProgress = Math.round((thisWeekPosts.length / objectives.weeklyTarget) * 100);
  const monthProgress = Math.round((thisMonthPosts.length / objectives.monthlyTarget) * 100);

  const contentMix = useMemo(() => {
    const counts = {}; CATEGORIES.forEach(c => { counts[c.id] = 0; });
    thisMonthPosts.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });
    const total = thisMonthPosts.length || 1;
    return CATEGORIES.map(c => ({ ...c, count: counts[c.id], percent: Math.round((counts[c.id] / total) * 100) }));
  }, [thisMonthPosts]);

  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d) => { const fd = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); return fd === 0 ? 6 : fd - 1; };
  const calDays = useMemo(() => { const days = []; for (let i = 0; i < getFirstDay(currentMonth); i++) days.push(null); for (let i = 1; i <= getDaysInMonth(currentMonth); i++) days.push(i); return days; }, [currentMonth]);
  const postsForDay = (day) => { if (!day) return []; const ds = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; return scheduledPosts.filter(p => p.date === ds); };
  const isToday = (day) => day && day === now.getDate() && currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();

  const bannerDays = useMemo(() => {
    const days = [];
    for (let i = -2; i < 12; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: d, dateStr: ds, isToday: i === 0, posts: scheduledPosts.filter(p => p.date === ds) });
    }
    return days;
  }, [scheduledPosts]);

  const challenges = useMemo(() => {
    const ch = [];
    const mixLow = contentMix.filter(c => c.percent < c.target - 5 && c.target > 0);
    if (mixLow.length > 0) ch.push({ icon: Target, color: T.amber, text: `Publiez plus de "${mixLow[0].label}" — ${mixLow[0].percent}% vs objectif ${mixLow[0].target}%` });
    if (weekProgress < 50) ch.push({ icon: Flame, color: T.red, text: `${thisWeekPosts.length}/${objectives.weeklyTarget} posts cette semaine — accélérez !` });
    if (weekProgress >= 100) ch.push({ icon: Trophy, color: T.green, text: "Objectif hebdo atteint ! Continuez !" });
    if (ch.length === 0) ch.push({ icon: Lightbulb, color: T.accent, text: "Publiez entre 8h-10h en semaine pour 2x plus d'engagement" });
    return ch;
  }, [contentMix, weekProgress, thisWeekPosts]);

  const smartSuggestions = useMemo(() => getSuggestions(scheduledPosts, contentMix, now), [scheduledPosts, contentMix]);

  const perfStats = useMemo(() => {
    const n = PERF_DATA.length || 1;
    return {
      avgImpressions: Math.round(PERF_DATA.reduce((a, p) => a + p.impressions, 0) / n),
      avgEngagement: PERF_DATA.length === 0 ? "0.0" : ((PERF_DATA.reduce((a, p) => a + p.likes + p.comments + p.shares, 0) / (PERF_DATA.reduce((a, p) => a + p.impressions, 0) || 1)) * 100).toFixed(1),
      totalLikes: PERF_DATA.reduce((a, p) => a + p.likes, 0),
      total: PERF_DATA.length,
      bestPost: PERF_DATA.reduce((b, p) => p.impressions > (b?.impressions || 0) ? p : b, null),
    };
  }, []);

  /* ── ACTIONS ── */
  const handleGenerate = async () => {
    // Validate inputs
    if (false) {
      showNotification("Saisissez un sujet", "warning");
      return;
    }
    setGen(s => ({ ...s, isGenerating: true }));
    try {
      // Build params for AI generation
      const params = {
        topic: gen.category === "job_offer" && gen.selectedJob ? gen.selectedJob.title : gen.topic,
        tone: gen.tone,
        category: gen.category,
        includeHashtags: gen.includeHashtags,
        includeCTA: gen.includeCTA,
      };
      // Add job info if applicable
      if (gen.category === "job_offer" && gen.selectedJob) {
        params.jobInfo = {
          title: gen.selectedJob.title,
          location: gen.selectedJob.location,
          department: gen.selectedJob.department,
          url: gen.selectedJob.url,
        };
      }
      const data = await API.generatePost(params);
      setGen(s => ({ ...s, content: data.content, isGenerating: false }));
      showNotification(data.model ? `Post généré par ${data.model} ✨` : "Post généré !");
      API.trackActivity("generate_post", { category: gen.category, tone: gen.tone, topic: params.topic, ai: true });
    } catch (err) {
      console.error("AI generation error:", err);
      // Fallback to local templates if API fails
      if (gen.category === "job_offer" && gen.selectedJob) {
        setGen(s => ({ ...s, content: generateJobPost(s.selectedJob, s.tone, s.includeHashtags, s.includeCTA), isGenerating: false }));
      } else {
        setGen(s => ({ ...s, content: generateAIPost(s.topic, s.tone, s.category, s.includeHashtags, s.includeCTA), isGenerating: false }));
      }
      showNotification("Génération IA indisponible — post template utilisé", "warning");
      API.trackActivity("generate_post", { category: gen.category, tone: gen.tone, topic: gen.topic, ai: false });
    }
  };

  const refreshJobs = async () => {
    setJobsLoading(true);
    try {
      const data = await API.fetchTeamtailorJobs();
      if (data.jobs && data.jobs.length > 0) {
        setTalentysJobs(data.jobs);
        showNotification(`${data.jobs.length} offres chargées depuis Teamtailor`);
      } else {
        // Fallback to cache if API returns nothing
        setTalentysJobs(TALENTYS_JOBS_CACHE);
        showNotification(`${TALENTYS_JOBS_CACHE.length} offres chargées (cache)`);
      }
    } catch (err) {
      console.error('Teamtailor fetch error:', err);
      setTalentysJobs(TALENTYS_JOBS_CACHE);
      showNotification("Offres chargées depuis le cache (API indisponible)", "warning");
    } finally {
      setJobsLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return talentysJobs;
    const q = jobSearch.toLowerCase();
    return talentysJobs.filter(j => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.department.toLowerCase().includes(q));
  }, [talentysJobs, jobSearch]);

  const openSchedule = (content, imageUrl = "") => { setModalData({ content, imageUrl, isNew: true }); setSchedForm({ date: "", time: "09:00", author: "Marco B." }); setShowModal("schedule"); };
  const openPublishNow = (content, imageUrl = "") => { setModalData({ content, imageUrl }); setShowModal("publish"); };

  const confirmSchedule = () => {
    if (!schedForm.date) { showNotification("Choisissez une date", "warning"); return; }
    setScheduledPosts(prev => [...prev, { id: Date.now(), content: modalData.content, date: schedForm.date, time: schedForm.time, category: gen.category || "job_offer", status: "scheduled", author: schedForm.author, imageUrl: modalData.imageUrl || "" }]);
    setShowModal(null); showNotification("Publication programmée !");
    API.trackActivity("schedule_post", { date: schedForm.date, time: schedForm.time, category: gen.category });
  };

  const [publishing, setPublishing] = useState(false);
  const confirmPublishNow = async () => {
    if (!linkedinConnected) { showNotification("Connectez LinkedIn d'abord", "warning"); setShowModal("linkedin"); return; }
    setPublishing(true);
    try {
      const result = await API.linkedinPublish(modalData.content, modalData.imageUrl || null);
      if (result.success) {
        showNotification("Publié sur LinkedIn avec succès !");
        API.trackActivity("publish_linkedin", { hasImage: !!(modalData.imageUrl) });
        setShowModal(null);
      } else {
        showNotification("Erreur lors de la publication", "warning");
      }
    } catch (err) {
      console.error('Publish error:', err);
      showNotification(err.message || "Erreur de publication", "warning");
    } finally {
      setPublishing(false);
    }
  };

  const deletePost = (id) => { setScheduledPosts(prev => prev.filter(p => p.id !== id)); showNotification("Supprimé", "warning"); };
  const copyText = (t) => { navigator.clipboard?.writeText(t); showNotification("Copié !"); API.trackActivity("copy_post"); };
  const useTemplate = (tpl) => { setGen(s => ({ ...s, content: tpl.content, category: tpl.category })); setTab("generator"); showNotification("Template chargé !"); API.trackActivity("use_template", { template: tpl.title }); };

  const searchPexels = async (query, page = 1) => {
    if (page === 1) { setPexelsLoading(true); } else { setPexelsLoadingMore(true); }
    setPexelsSearch(query);
    try {
      const data = await API.searchPexels(query, page);
      if (data.photos && data.photos.length > 0) {
        if (page === 1) { setPexelsResults(data.photos); } else { setPexelsResults(prev => [...prev, ...data.photos]); }
        setPexelsPage(page);
        setPexelsTotalResults(data.totalResults || 0);
      } else if (page === 1) {
        setPexelsResults(PEXELS_RESULTS.recrutement.sort(() => Math.random() - 0.5));
        setPexelsTotalResults(0);
        showNotification("Aucune image trouvée — visuels par défaut", "warning");
      }
      API.trackActivity("search_pexels", { query, page });
    } catch (err) {
      console.error('Pexels search error:', err);
      if (page === 1) {
        setPexelsResults(PEXELS_RESULTS.recrutement.sort(() => Math.random() - 0.5));
        showNotification("API Pexels indisponible — visuels par défaut", "warning");
      }
    } finally {
      setPexelsLoading(false);
      setPexelsLoadingMore(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showNotification("Ce fichier n'est pas une image", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showNotification("Image trop lourde (max 5 Mo)", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setGen(s => ({ ...s, selectedImage: { src: ev.target.result, alt: file.name, photographer: "Mon image", isUpload: true } }));
      showNotification("Image importée !");
      API.trackActivity("upload_image", { fileName: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const connectLinkedin = async () => {
    try {
      const authUrl = await API.linkedinAuth();
      // Open LinkedIn OAuth in a new window
      window.open(authUrl, '_blank', 'width=600,height=700');
      showNotification("Connectez-vous dans la fenêtre LinkedIn...");
    } catch (err) {
      console.error('LinkedIn auth error:', err);
      showNotification("Erreur connexion LinkedIn", "warning");
    }
  };

  const disconnectLinkedin = async () => {
    try {
      await API.linkedinDisconnect();
      setLinkedinConnected(false);
      setLinkedinProfile({ name: "", picture: "" });
      showNotification("LinkedIn déconnecté");
    } catch (err) {
      console.error('LinkedIn disconnect error:', err);
    }
  };

  // Check LinkedIn connection status on mount + after OAuth redirect
  useEffect(() => {
    const checkLinkedin = async () => {
      try {
        const data = await API.linkedinProfile();
        if (data.connected) {
          setLinkedinConnected(true);
          setLinkedinProfile(data.profile);
        }
      } catch {}
    };
    checkLinkedin();

    // Check URL params for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedin_connected') === 'true') {
      checkLinkedin();
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('linkedin_error')) {
      showNotification("Erreur connexion LinkedIn : " + params.get('linkedin_error'), "warning");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  /* ════════════════════════════════════════════════════════════════
     SIDEBAR
     ════════════════════════════════════════════════════════════════ */
  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: Home },
    { id: "generator", label: "Créer un post", icon: Sparkles },
    { id: "calendar", label: "Calendrier", icon: Calendar },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "analytics", label: "Performances", icon: BarChart3 },
    ...(authUser.role === "admin" ? [{ id: "admin", label: "Utilisateurs", icon: Users }] : []),
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  const sidebarContent = (
    <div style={{ width: 240, background: T.bgSurface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh" }}>
      <div style={{ padding: "22px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>PostFlow</div>
            <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>by Talentys RH</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: "14px 10px", flex: 1 }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px",
              background: active ? T.accentBg : "transparent", border: "none", borderRadius: 10, cursor: "pointer", marginBottom: 2,
              color: active ? T.accentLight : T.textSecondary, fontWeight: active ? 600 : 450, fontSize: 13.5,
              transition: "all 0.15s", fontFamily: "Inter, sans-serif", position: "relative", textAlign: "left",
            }}>
              {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: 4, background: T.accent }} />}
              <Icon size={18} style={{ opacity: active ? 1 : 0.6 }} />
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => setShowModal("linkedin")} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
          background: linkedinConnected ? T.greenBg : T.amberBg, border: `1px solid ${linkedinConnected ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
          borderRadius: 10, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left",
        }}>
          <Linkedin size={16} color={linkedinConnected ? T.green : T.amber} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: linkedinConnected ? T.green : T.amber }}>{linkedinConnected ? "Connecté" : "Non connecté"}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{linkedinConnected ? linkedinProfile.name : "Cliquez pour lier"}</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: linkedinConnected ? T.green : T.amber, boxShadow: `0 0 8px ${linkedinConnected ? T.green : T.amber}` }} />
        </button>
      </div>
      <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "center" }}>
        <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer", color: T.textSecondary, fontSize: 11.5, fontWeight: 500, fontFamily: "Inter, sans-serif", width: "100%", justifyContent: "center", transition: "all 0.2s" }}>
          {themeMode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {themeMode === "dark" ? "Mode clair" : "Mode sombre"}
        </button>
      </div>
      <div style={{ padding: "8px 14px 12px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: themeMode === "light" ? T.bgElevated : T.bgCard, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>M</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{authUser.name}</div><div style={{ fontSize: 10, color: T.textMuted }}>{authUser.role === "admin" ? "Admin" : "Consultant"}</div></div>
          <button onClick={onLogout} title="Déconnexion" style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", padding: 4, borderRadius: 6 }}><LogOut size={14} /></button>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     DASHBOARD
     ════════════════════════════════════════════════════════════════ */
  const Dashboard = () => (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.2 }}>Bonjour {authUser.name.split(" ")[0]} 👋</h1>
          <p style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>{DAYS_FULL[now.getDay()]} {now.getDate()} {MONTHS_FR[now.getMonth()]} {now.getFullYear()}</p>
        </div>
        <Btn variant="gradient" onClick={() => setTab("generator")}><Sparkles size={16} /> Nouveau post</Btn>
      </div>

      {/* Calendar banner */}
      <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: "16px 4px 12px", marginBottom: 20, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8, margin: 0 }}><Calendar size={16} color={T.accent} /> Planning 14 jours</h3>
          <button onClick={() => setTab("calendar")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif" }}>Calendrier complet <ArrowRight size={14} /></button>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 12px 8px", scrollBehavior: "smooth" }}>
          {bannerDays.map((day, i) => (
            <div key={i} onClick={() => { if (day.posts.length) setTab("calendar"); }} style={{
              minWidth: 76, padding: "10px 8px", borderRadius: 12, textAlign: "center", cursor: "pointer", flexShrink: 0,
              background: day.isToday ? T.accentBg : day.posts.length > 0 ? "rgba(255,255,255,0.02)" : "transparent",
              border: `1.5px solid ${day.isToday ? T.accent + "50" : day.posts.length > 0 ? T.border : "transparent"}`,
              transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{DAYS_FR[(day.date.getDay() + 6) % 7]}</div>
              <div style={{ fontSize: 20, fontWeight: day.isToday ? 800 : 600, color: day.isToday ? T.accentLight : T.text, margin: "4px 0" }}>{day.date.getDate()}</div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center", minHeight: 8 }}>
                {day.posts.slice(0, 3).map((p, j) => { const cat = CATEGORIES.find(c => c.id === p.category); return <div key={j} style={{ width: 8, height: 8, borderRadius: "50%", background: cat?.color || T.accent }} />; })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objectives row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative" }}>
            <ProgressRing progress={weekProgress} size={64} color={weekProgress >= 100 ? T.green : T.accent} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: T.text }}>{thisWeekPosts.length}/{objectives.weeklyTarget}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Objectif hebdo</div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{objectives.weeklyTarget} posts / semaine</div>
            {weekProgress >= 100 && <div style={{ fontSize: 11, color: T.green, fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Atteint !</div>}
          </div>
        </div>
        <div style={{ flex: "1 1 200px", background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative" }}>
            <ProgressRing progress={monthProgress} size={64} color={monthProgress >= 100 ? T.green : T.pink} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: T.text }}>{thisMonthPosts.length}/{objectives.monthlyTarget}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Objectif mensuel</div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{MONTHS_FR[now.getMonth()]}</div>
          </div>
        </div>
        <div style={{ flex: "1 1 280px", background: T.gradientSubtle, borderRadius: 16, border: `1px solid ${T.glassBorder}`, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><Flame size={16} color={T.amber} /> Challenges</div>
          {challenges.map((ch, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6, padding: "7px 10px", background: "rgba(0,0,0,0.25)", borderRadius: 8 }}>
              <ch.icon size={14} color={ch.color} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.4 }}>{ch.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content mix */}
      <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 22, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}><Target size={16} color={T.accent} /> Mix de contenu — {MONTHS_FR[now.getMonth()]}</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {contentMix.map(cat => {
            const diff = cat.percent - cat.target;
            const statusColor = diff >= -2 ? T.green : diff >= -10 ? T.amber : T.red;
            return (
              <div key={cat.id} style={{ flex: "1 1 130px", padding: "14px 14px", borderRadius: 12, background: `${cat.color}08`, border: `1px solid ${cat.color}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><cat.icon size={13} color={cat.color} /><span style={{ fontSize: 11.5, fontWeight: 600, color: T.text }}>{cat.label}</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}><span style={{ fontSize: 22, fontWeight: 800, color: cat.color }}>{cat.count}</span><span style={{ fontSize: 10, color: T.textMuted }}>posts</span></div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: `${cat.color}15` }}><div style={{ height: "100%", borderRadius: 2, background: cat.color, width: `${Math.min((cat.count / (thisMonthPosts.length || 1)) * 100, 100)}%`, transition: "width 0.6s ease" }} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}><span style={{ fontSize: 10, color: T.textMuted }}>{cat.percent}%</span><span style={{ fontSize: 10, fontWeight: 600, color: statusColor }}>cible {cat.target}%</span></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 22, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8, margin: 0 }}><Lightbulb size={16} color={T.amber} /> Suggestions de publications</h3>
            <span style={{ fontSize: 11, color: T.textMuted, background: T.bgElevated, padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>Basé sur votre mix & historique</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {smartSuggestions.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: `${s.category.color}06`, border: `1px solid ${s.category.color}18`, transition: "all 0.2s" }}>
                <div style={{ minWidth: 54, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.dayName}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.category.color, lineHeight: 1.2 }}>{s.date.getDate()}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{MONTHS_FR[s.date.getMonth()].slice(0, 4)}.</div>
                </div>
                <div style={{ width: 1, height: 40, background: `${s.category.color}25`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <s.category.icon size={13} color={s.category.color} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.topic.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: s.category.color, background: `${s.category.color}15`, padding: "2px 7px", borderRadius: 8 }}>{s.category.label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.4 }}>{s.topic.hint}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setGen(g => ({ ...g, category: s.category.id, topic: s.topic.title })); setTab("generator"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: `1px solid ${s.category.color}30`, background: `${s.category.color}10`, color: s.category.color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s" }} title="Créer ce post">
                    <Sparkles size={12} /> Créer
                  </button>
                </div>
              </div>
            ))}
          </div>
          {smartSuggestions.length > 4 && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>+ {smartSuggestions.length - 4} autres suggestions disponibles</span>
            </div>
          )}
        </div>
      )}

            {/* Upcoming */}
      <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Prochaines publications</h3>
          <button onClick={() => setTab("calendar")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Tout voir →</button>
        </div>
        {scheduledPosts.filter(p => p.status === "scheduled").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 4).map(post => {
          const cat = CATEGORIES.find(c => c.id === post.category);
          return (
            <div key={post.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cat?.color || T.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cat && <cat.icon size={17} color={cat.color} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.content.split("\n")[0]}</div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                  <span>{new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span><span>{post.time}</span><span>{post.author}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                <Btn variant="ghost" size="sm" onClick={() => copyText(post.content)}><Copy size={13} /></Btn>
                <Btn variant="danger" size="sm" onClick={() => deletePost(post.id)}><Trash2 size={13} /></Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     GENERATOR
     ════════════════════════════════════════════════════════════════ */
  const Generator = () => (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: 0 }}>Créer une publication ✨</h1>
        <p style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>Générez, personnalisez et publiez en quelques clics</p>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ── JOB SELECTOR (when category = job_offer) ── */}
          {gen.category === "job_offer" && (
            <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.accent}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.accentLight, display: "flex", alignItems: "center", gap: 8 }}>
                  <Briefcase size={15} color={T.accentLight} /> Offre Talentys RH en cours
                </label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{talentysJobs.length} offres</span>
                  <button onClick={refreshJobs} disabled={jobsLoading} style={{ background: T.accentBg, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: T.accentLight, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                    <RefreshCw size={11} style={jobsLoading ? { animation: "spin 1s linear infinite" } : {}} /> {jobsLoading ? "..." : "Actualiser"}
                  </button>
                </div>
              </div>
              {/* Search bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 11px", background: T.bgInput, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                <Search size={13} color={T.textMuted} />
                <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Filtrer par poste, ville, secteur..."
                  style={{ background: "none", border: "none", color: T.text, fontSize: 12.5, outline: "none", width: "100%", fontFamily: "Inter, sans-serif" }} />
                {jobSearch && <button onClick={() => setJobSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", padding: 2 }}><X size={12} /></button>}
              </div>
              {/* Job list */}
              <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 10, border: `1px solid ${T.border}` }}>
                {filteredJobs.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: T.textMuted }}>Aucune offre trouvée</div>
                ) : filteredJobs.map(job => {
                  const isSelected = gen.selectedJob?.id === job.id;
                  return (
                    <div key={job.id} onClick={() => {
                      setGen(s => ({ ...s, selectedJob: isSelected ? null : job, topic: isSelected ? "" : `Offre : ${job.title} à ${job.location}` }));
                    }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer",
                        background: isSelected ? T.accentBg : "transparent", borderBottom: `1px solid ${T.border}`,
                        transition: "background 0.15s",
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? T.accent : T.borderLight}`,
                        background: isSelected ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {isSelected && <Check size={10} color="#fff" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: isSelected ? T.text : T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.title}
                        </div>
                        <div style={{ fontSize: 10.5, color: T.textMuted, display: "flex", gap: 8, marginTop: 2 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} /> {job.location}</span>
                          <span>{job.department}</span>
                        </div>
                      </div>
                      <a href={`https://jobs.talentysrh.com${job.url}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ color: T.textMuted, display: "flex", flexShrink: 0 }}>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  );
                })}
              </div>
              {gen.selectedJob && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: `${T.accent}12`, borderRadius: 8, border: `1px solid ${T.accent}25`, display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={15} color={T.accentLight} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.accentLight }}>{gen.selectedJob.title}</div>
                    <div style={{ fontSize: 10.5, color: T.textMuted }}>{gen.selectedJob.location} · {gen.selectedJob.department}</div>
                  </div>
                  <button onClick={() => setGen(s => ({ ...s, selectedJob: null, topic: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex" }}><X size={14} /></button>
                </div>
              )}
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <Globe size={10} /> Source : <a href="https://jobs.talentysrh.com/jobs" target="_blank" rel="noreferrer" style={{ color: T.accent }}>jobs.talentysrh.com</a> via Teamtailor
              </p>
            </div>
          )}

          {/* ── FREE TOPIC (for all other categories) ── */}
          <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, display: gen.category === "job_offer" && gen.selectedJob ? "none" : "block" }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Target size={15} color={T.accent} /> {gen.category === "job_offer" ? "Ou décrivez librement une offre" : "Sujet"}
            </label>
            <textarea value={gen.topic} onChange={e => setGen(s => ({ ...s, topic: e.target.value }))} placeholder={gen.category === "job_offer" ? "Si l'offre n'est pas dans la liste, décrivez-la ici..." : "Ex: Les nouvelles tendances du recrutement en Outre-Mer..."}
              style={{ width: "100%", minHeight: 80, padding: 14, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, resize: "vertical", fontFamily: "Inter, sans-serif", lineHeight: 1.5, boxSizing: "border-box", outline: "none" }}
              onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", background: T.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${T.border}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Smile size={14} color={T.accent} /> Ton</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setGen(s => ({ ...s, tone: t.id }))} style={{
                    padding: "6px 11px", borderRadius: 18, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 5, background: gen.tone === t.id ? `${t.color}20` : T.bgElevated,
                    color: gen.tone === t.id ? t.color : T.textMuted, transition: "all 0.15s", fontFamily: "Inter, sans-serif",
                  }}><t.icon size={12} /> {t.label}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: "1 1 200px", background: T.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${T.border}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Hash size={14} color={T.accent} /> Catégorie</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setGen(s => ({ ...s, category: c.id }))} style={{
                    padding: "6px 11px", borderRadius: 18, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 5, background: gen.category === c.id ? `${c.color}20` : T.bgElevated,
                    color: gen.category === c.id ? c.color : T.textMuted, transition: "all 0.15s", fontFamily: "Inter, sans-serif",
                  }}><c.icon size={12} /> {c.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{ key: "includeHashtags", label: "Hashtags", icon: Hash }, { key: "includeCTA", label: "Call-to-action", icon: MessageSquare }].map(({ key, label, icon: Icon }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: gen[key] ? T.accentBg : T.bgCard, border: `1px solid ${gen[key] ? T.accent + "30" : T.border}`, color: gen[key] ? T.accentLight : T.textMuted, fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
                <input type="checkbox" checked={gen[key]} onChange={e => setGen(s => ({ ...s, [key]: e.target.checked }))} style={{ display: "none" }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, background: gen[key] ? T.accent : "transparent", border: `2px solid ${gen[key] ? T.accent : T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{gen[key] && <Check size={10} color="#fff" />}</div>
                <Icon size={12} /> {label}
              </label>
            ))}
            <Btn variant="secondary" size="sm" onClick={() => { setShowModal("pexels"); if (!pexelsResults.length) searchPexels(gen.topic || "business"); }}><ImageIcon size={12} /> Visuel Pexels</Btn>
            <Btn variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}><Upload size={12} /> Mon image</Btn>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          </div>
          {gen.selectedImage && (
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <img src={gen.selectedImage.src} alt={gen.selectedImage.alt} style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <button onClick={() => setGen(s => ({ ...s, selectedImage: null }))} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><X size={13} /></button>
              <div style={{ position: "absolute", bottom: 6, left: 6, fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "2px 7px", borderRadius: 6 }}>{gen.selectedImage.isUpload ? "📎 Mon image" : `📷 ${gen.selectedImage.photographer} via Pexels`}</div>
            </div>
          )}
          <button onClick={handleGenerate} disabled={gen.isGenerating} style={{
            width: "100%", padding: "15px", background: T.gradient, border: "none", borderRadius: 14, color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: gen.isGenerating ? "wait" : "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10, opacity: gen.isGenerating ? 0.7 : 1, transition: "all 0.3s", fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)", animation: gen.isGenerating ? "none" : "glow 3s ease-in-out infinite",
          }}>
            {gen.isGenerating ? <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Génération...</> : <><Sparkles size={18} /> Générer le post</>}
          </button>
        </div>

        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}><Edit3 size={15} color={T.accent} /> Contenu</label>
              <span style={{ fontSize: 11, color: gen.content.length > 2800 ? T.red : T.textMuted, fontWeight: 500 }}>{gen.content.length}/3000</span>
            </div>
            <textarea value={gen.content} onChange={e => setGen(s => ({ ...s, content: e.target.value }))} placeholder="Le contenu apparaîtra ici après la génération..."
              style={{ width: "100%", minHeight: 180, padding: 14, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, resize: "vertical", fontFamily: "Inter, sans-serif", lineHeight: 1.6, boxSizing: "border-box", outline: "none" }}
              onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
            {gen.content && (
              <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                <Btn variant="gradient" onClick={() => openPublishNow(gen.content, gen.selectedImage?.src)}><Send size={13} /> Publier maintenant</Btn>
                <Btn variant="primary" onClick={() => openSchedule(gen.content, gen.selectedImage?.src)}><Clock size={13} /> Programmer</Btn>
                <Btn variant="secondary" onClick={() => copyText(gen.content)}><Copy size={13} /> Copier</Btn>
                <Btn variant="secondary" onClick={handleGenerate} style={{ display: "flex", alignItems: "center", gap: 5 }}><RefreshCw size={13} /> Régénérer</Btn>
              </div>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}><Eye size={15} color={T.accent} /> Aperçu LinkedIn</h3>
            <LinkedInPreview content={gen.content} imageUrl={gen.selectedImage?.src} />
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     CALENDAR
     ════════════════════════════════════════════════════════════════ */
  const CalendarPage = () => (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: 0 }}>Calendrier éditorial 📅</h1>
          <p style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>Planifiez et visualisez vos publications</p>
        </div>
        <Btn onClick={() => { setModalData({ content: "", imageUrl: "", isNew: true }); setSchedForm({ date: "", time: "09:00", author: "Marco B." }); setShowModal("schedule"); }}><Plus size={15} /> Nouvelle publication</Btn>
      </div>
      <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: T.text, display: "flex" }}><ChevronLeft size={16} /></button>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>{MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: T.text, display: "flex" }}><ChevronRight size={16} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.border}` }}>
          {DAYS_FR.map(d => <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {calDays.map((day, i) => {
            const dp = postsForDay(day);
            return (
              <div key={i} style={{ minHeight: 88, padding: 6, borderRight: (i + 1) % 7 !== 0 ? `1px solid ${T.border}` : "none", borderBottom: `1px solid ${T.border}`, background: isToday(day) ? `${T.accent}08` : "transparent" }}>
                {day && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: isToday(day) ? 800 : 400, color: isToday(day) ? T.accentLight : T.text, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday(day) ? T.accentBg : "transparent", marginBottom: 3 }}>{day}</div>
                    {dp.map(post => {
                      const cat = CATEGORIES.find(c => c.id === post.category);
                      return <div key={post.id} onClick={() => { setModalData({ ...post }); setSchedForm({ date: post.date, time: post.time, author: post.author }); setShowModal("schedule"); }}
                        style={{ padding: "3px 6px", borderRadius: 5, fontSize: 10, background: `${cat?.color || T.accent}18`, color: cat?.color || T.accent, marginBottom: 2, cursor: "pointer", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: `2px solid ${cat?.color || T.accent}` }}>
                        {post.time}
                      </div>;
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 20, background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}` }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}><h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Programmées ({scheduledPosts.filter(p => p.status === "scheduled").length})</h3></div>
        {scheduledPosts.filter(p => p.status === "scheduled").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(post => {
          const cat = CATEGORIES.find(c => c.id === post.category);
          return (
            <div key={post.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cat?.color || T.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cat && <cat.icon size={17} color={cat.color} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.content.split("\n")[0]}</div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                  <span>📅 {new Date(post.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}</span><span>🕐 {post.time}</span><span>👤 {post.author}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                <Btn variant="ghost" size="sm" onClick={() => copyText(post.content)}><Copy size={13} /></Btn>
                <Btn variant="danger" size="sm" onClick={() => deletePost(post.id)}><Trash2 size={13} /></Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     TEMPLATES
     ════════════════════════════════════════════════════════════════ */
  const TemplatesPage = () => {
    const filtered = TEMPLATES.filter(t => {
      const ms = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.content.toLowerCase().includes(searchTerm.toLowerCase());
      const mc = filterCat === "all" || t.category === filterCat;
      return ms && mc;
    });
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: 0 }}>Templates 📚</h1>
          <p style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>{TEMPLATES.length} modèles prêts à personnaliser</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: T.bgCard, borderRadius: 10, border: `1px solid ${T.border}`, flex: "1 1 200px" }}>
            <Search size={14} color={T.textMuted} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher..." style={{ background: "none", border: "none", color: T.text, fontSize: 13, outline: "none", width: "100%", fontFamily: "Inter, sans-serif" }} />
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button onClick={() => setFilterCat("all")} style={{ padding: "6px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === "all" ? T.accentBg : T.bgCard, color: filterCat === "all" ? T.accentLight : T.textMuted, fontFamily: "Inter, sans-serif" }}>Tous</button>
            {CATEGORIES.map(c => <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ padding: "6px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, background: filterCat === c.id ? `${c.color}20` : T.bgCard, color: filterCat === c.id ? c.color : T.textMuted, fontFamily: "Inter, sans-serif" }}><c.icon size={11} /> {c.label}</button>)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 12 }}>
          {filtered.map(tpl => {
            const cat = CATEGORIES.find(c => c.id === tpl.category);
            return (
              <div key={tpl.id} style={{ background: T.bgCard, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden", animation: "slideUp 0.3s ease" }}>
                <div style={{ padding: "16px 16px 0" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 12, fontSize: 10.5, fontWeight: 600, background: `${cat?.color || T.accent}15`, color: cat?.color || T.accent, marginBottom: 8 }}>{cat && <cat.icon size={10} />} {cat?.label}</div>
                  <h4 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: T.text }}>{tpl.title}</h4>
                  <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>{tpl.preview}</p>
                  <div style={{ margin: "8px 0 12px", padding: 9, background: T.bgInput, borderRadius: 8, fontSize: 11, color: T.textSecondary, lineHeight: 1.5, maxHeight: 90, overflow: "hidden", whiteSpace: "pre-wrap", position: "relative" }}>
                    {tpl.content.substring(0, 160)}...
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 25, background: `linear-gradient(transparent, ${T.bgInput})` }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, padding: "0 16px 14px" }}>
                  <Btn variant="primary" size="sm" onClick={() => useTemplate(tpl)} style={{ flex: 1, justifyContent: "center" }}><Sparkles size={12} /> Utiliser</Btn>
                  <Btn variant="secondary" size="sm" onClick={() => { setModalData(tpl); setShowModal("template"); }}><Eye size={12} /></Btn>
                  <Btn variant="secondary" size="sm" onClick={() => copyText(tpl.content)}><Copy size={12} /></Btn>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════
     ANALYTICS
     ════════════════════════════════════════════════════════════════ */
  const AnalyticsPage = () => (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: 0 }}>Performances 📊</h1>
        <p style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>Suivez l'impact de vos publications</p>
      </div>
      {!linkedinConnected && (
        <div style={{ background: T.amberBg, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <AlertCircle size={18} color={T.amber} />
          <span style={{ fontSize: 13, color: T.amber, flex: 1 }}>Connectez LinkedIn pour le suivi automatique</span>
          <Btn size="sm" onClick={() => setShowModal("linkedin")}><Link2 size={12} /> Connecter</Btn>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { label: "Impressions moy.", value: perfStats.avgImpressions.toLocaleString(), icon: Eye, color: T.accent, bg: T.accentBg },
          { label: "Taux engagement", value: `${perfStats.avgEngagement}%`, icon: Activity, color: T.green, bg: T.greenBg },
          { label: "Total likes", value: perfStats.totalLikes, icon: Heart, color: T.pink, bg: T.pinkBg },
          { label: "Publications", value: perfStats.total, icon: FileText, color: T.cyan, bg: T.cyanBg },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ flex: "1 1 170px", background: T.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${T.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Icon size={17} color={color} /></div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>{value}</div>
            <div style={{ fontSize: 11.5, color: T.textSecondary, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      {perfStats.bestPost && (
        <div style={{ background: T.gradientSubtle, borderRadius: 14, border: `1px solid ${T.glassBorder}`, padding: 18, marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trophy size={20} color="#fff" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Meilleur post</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 2 }}>{perfStats.bestPost.title}</div>
            <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{perfStats.bestPost.impressions.toLocaleString()} impressions · {perfStats.bestPost.likes} likes · {perfStats.bestPost.comments} commentaires</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.green }}>{perfStats.bestPost.ctr}%</div>
        </div>
      )}
      <div style={{ background: T.bgCard, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Détail par publication</h3>
          <div style={{ display: "flex", gap: 3 }}>
            {["week", "month", "all"].map(r => <button key={r} onClick={() => setPerfRange(r)} style={{ padding: "4px 9px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", background: perfRange === r ? T.accentBg : "transparent", color: perfRange === r ? T.accentLight : T.textMuted, fontFamily: "Inter, sans-serif" }}>{r === "week" ? "7j" : r === "month" ? "30j" : "Tout"}</button>)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "9px 18px", borderBottom: `1px solid ${T.border}`, gap: 6 }}>
          {["Publication", "Impressions", "Likes", "Comments", "Partages", "Eng."].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</div>)}
        </div>
        {PERF_DATA.map(post => {
          const eng = (((post.likes + post.comments + post.shares) / post.impressions) * 100).toFixed(1);
          const cat = CATEGORIES.find(c => c.id === post.category);
          return (
            <div key={post.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "11px 18px", borderBottom: `1px solid ${T.border}`, gap: 6, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>{cat && <span style={{ color: cat.color }}>{cat.label}</span>} · {new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{post.impressions.toLocaleString()}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.pink }}>{post.likes}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.accent }}>{post.comments}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.cyan }}>{post.shares}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: parseFloat(eng) > 5 ? T.green : T.amber }}>{eng}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     SETTINGS
     ════════════════════════════════════════════════════════════════ */
  const SettingsPage = () => (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: "0 0 24px" }}>Paramètres ⚙️</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 580 }}>
        <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Linkedin size={17} color="#0077B5" /> Compte LinkedIn</h3>
          {linkedinConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>M</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{linkedinProfile.name}</div><div style={{ fontSize: 12, color: T.green, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Connecté</div></div>
              <Btn variant="danger" size="sm" onClick={() => { setLinkedinConnected(false); showNotification("Déconnecté", "warning"); }}><Unlink size={12} /> Déconnecter</Btn>
            </div>
          ) : (
            <Btn onClick={() => setShowModal("linkedin")}><Link2 size={14} /> Connecter mon LinkedIn</Btn>
          )}
        </div>
        <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Target size={17} color={T.accent} /> Objectifs</h3>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: 5 }}>Posts / semaine</label>
              <input type="number" min={1} max={14} value={objectives.weeklyTarget} onChange={e => setObjectives(o => ({ ...o, weeklyTarget: parseInt(e.target.value) || 1 }))}
                style={{ width: "100%", padding: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 15, fontWeight: 700, textAlign: "center", fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: 5 }}>Posts / mois</label>
              <input type="number" min={1} max={60} value={objectives.monthlyTarget} onChange={e => setObjectives(o => ({ ...o, monthlyTarget: parseInt(e.target.value) || 1 }))}
                style={{ width: "100%", padding: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 15, fontWeight: 700, textAlign: "center", fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
        <div style={{ background: T.bgCard, borderRadius: 14, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 5px", display: "flex", alignItems: "center", gap: 8 }}><Camera size={17} color={T.amber} /> API Pexels</h3>
          <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 10px" }}>Clé gratuite sur <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer" style={{ color: T.accent }}>pexels.com/api</a></p>
          <input type="text" placeholder="Votre clé API Pexels" style={{ width: "100%", padding: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ background: T.gradientSubtle, borderRadius: 14, padding: 18, border: `1px solid ${T.glassBorder}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>💡 Comment fonctionne la connexion LinkedIn ?</div>
          <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>PostFlow utilise l'API officielle LinkedIn (OAuth 2.0) pour publier en votre nom. Vos identifiants ne sont jamais stockés. Vous pouvez révoquer l'accès à tout moment.</div>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     ADMIN PAGE
     ════════════════════════════════════════════════════════════════ */
  const AdminPage = () => {
    const [adminTab, setAdminTab] = useState("users");
    const [users, setUsers] = useState([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState("consultant");
    const [adminMsg, setAdminMsg] = useState(null);
    const [activityStats, setActivityStats] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);


    const handleReset = async () => {
      setResetting(true);
      try {
        await API.resetData(true, true);
        setAdminMsg({ type: "success", text: "Toutes les donnees ont ete reinitialisees avec succes !" });
        setResetConfirm(false);
        const u = await API.getUsers();
        setAdminUsers(u);
      } catch (e) {
        setAdminMsg({ type: "error", text: e.message });
      } finally {
        setResetting(false);
      }
    };

    useEffect(() => {
      API.getUsers().then(data => { setUsers(data.users || []); setAdminLoading(false); }).catch(() => setAdminLoading(false));
    }, []);

    useEffect(() => {
      if (adminTab === "activity") {
        setStatsLoading(true);
        Promise.all([API.getActivityStats(), API.getActivity(null, 50)]).then(([s, a]) => {
          setActivityStats(s.stats || []);
          setActivityLog(a.activity || []);
          setStatsLoading(false);
        }).catch(() => setStatsLoading(false));
      }
    }, [adminTab]);

    const loadUserActivity = async (userId) => {
      setSelectedUserId(userId);
      try {
        const data = await API.getActivity(userId, 50);
        setActivityLog(data.activity || []);
      } catch {}
    };

    const ACTION_LABELS = {
      login: { label: "Connexion", icon: "🔑", color: T.accent },
      publish_linkedin: { label: "Publication LinkedIn", icon: "📤", color: T.green },
      connect_linkedin: { label: "Connexion LinkedIn", icon: "🔗", color: "#0077B5" },
      generate_post: { label: "Génération de post", icon: "✨", color: T.pink },
      schedule_post: { label: "Programmation", icon: "📅", color: T.amber },
      use_template: { label: "Utilisation template", icon: "📋", color: T.cyan },
      search_pexels: { label: "Recherche image", icon: "🖼️", color: "#05A081" },
      copy_post: { label: "Copie de post", icon: "📄", color: T.textSecondary },
      upload_image: { label: "Import image", icon: "📎", color: "#8b5cf6" },
      publish_linkedin: { label: "Publication LinkedIn", icon: "🚀", color: "#0A66C2" },
      create_user: { label: "Création utilisateur", icon: "👤", color: T.accent },
    };

    const handleCreate = async () => {
      if (!newName.trim() || !newEmail.trim()) { setAdminMsg({ type: "warning", text: "Nom et email requis" }); return; }
      try {
        const data = await API.createUser(newEmail, newName, newRole);
        setUsers(prev => [...prev, data.user]);
        const emailInfo = data.emailSent ? "Email d'invitation envoyé !" : `Mot de passe temporaire : ${data.tempPassword} (email non configuré)`;
        setAdminMsg({ type: "success", text: `${data.user.name} créé. ${emailInfo}` });
        setNewName(""); setNewEmail(""); setNewRole("consultant"); setShowAddForm(false);
      } catch (err) { setAdminMsg({ type: "error", text: err.message }); }
    };

    const handleDelete = async (user) => {
      if (!confirm(`Supprimer ${user.name} (${user.email}) ?`)) return;
      try {
        await API.deleteUser(user.id);
        setUsers(prev => prev.filter(u => u.id !== user.id));
        setAdminMsg({ type: "success", text: `${user.name} supprimé` });
      } catch (err) { setAdminMsg({ type: "error", text: err.message }); }
    };

    const handleResend = async (user) => {
      try {
        const data = await API.resendInvite(user.id);
        const emailInfo = data.emailSent ? "Email renvoyé !" : `Nouveau mot de passe : ${data.tempPassword}`;
        setAdminMsg({ type: "success", text: `Invitation renvoyée à ${user.name}. ${emailInfo}` });
      } catch (err) { setAdminMsg({ type: "error", text: err.message }); }
    };

    const handleToggleStatus = async (user) => {
      try {
        const newStatus = user.status === "active" ? "disabled" : "active";
        const data = await API.updateUser(user.id, { status: newStatus });
        setUsers(prev => prev.map(u => u.id === user.id ? data.user : u));
        setAdminMsg({ type: "success", text: `${user.name} ${newStatus === "active" ? "activé" : "désactivé"}` });
      } catch (err) { setAdminMsg({ type: "error", text: err.message }); }
    };

    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.04em", margin: 0 }}>Console d'administration</h1>
            <p style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>Gérez vos consultants et suivez leur activité</p>
          </div>
          {adminTab === "users" && <Btn variant="gradient" onClick={() => setShowAddForm(true)}><Plus size={16} /> Nouveau consultant</Btn>}
        </div>

        {/* Admin Sub-tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: T.bgElevated, padding: 4, borderRadius: 12, width: "fit-content" }}>
          {[{ id: "users", label: "Utilisateurs", icon: Users }, { id: "activity", label: "Activité", icon: Activity }, { id: "tools", label: "Outils", icon: Settings }].map(t => (
            <button key={t.id} onClick={() => setAdminTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: adminTab === t.id ? T.accent : "transparent", color: adminTab === t.id ? "#fff" : T.textSecondary,
              fontWeight: 600, fontSize: 13, fontFamily: "Inter, sans-serif", transition: "all 0.15s",
            }}><t.icon size={15} /> {t.label}</button>
          ))}
        </div>

        {adminTab === "users" && <>{adminMsg && (
          <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 500, background: adminMsg.type === "success" ? T.greenBg : adminMsg.type === "error" ? T.redBg : T.amberBg, color: adminMsg.type === "success" ? T.green : adminMsg.type === "error" ? T.red : T.amber, border: `1px solid ${adminMsg.type === "success" ? T.green : adminMsg.type === "error" ? T.red : T.amber}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {adminMsg.text}
            <button onClick={() => setAdminMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16, padding: "0 4px" }}>&times;</button>
          </div>
        )}

        {showAddForm && (
          <div style={{ background: T.bgCard, borderRadius: 16, padding: 24, border: `1px solid ${T.accent}30`, marginBottom: 20, boxShadow: T.shadow }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}><Users size={18} color={T.accent} /> Créer un compte consultant</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 5 }}>Nom complet</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Sophie Martin"
                  style={{ width: "100%", padding: "10px 12px", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: "1 1 250px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 5 }}>Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="sophie@talentysrh.com"
                  style={{ width: "100%", padding: "10px 12px", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: "0 0 160px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 5 }}>Rôle</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
                  <option value="consultant">Consultant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => setShowAddForm(false)}>Annuler</Btn>
              <Btn onClick={handleCreate}><Send size={14} /> Créer et envoyer l'invitation</Btn>
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 10 }}>Un email contenant les identifiants de connexion et un guide d'utilisation sera envoyé automatiquement.</p>
          </div>
        )}

        {adminLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Loader size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} /></div>
        ) : (
          <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: "left", padding: "14px 16px", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Utilisateur</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rôle</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Statut</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Créé le</th>
                  <th style={{ textAlign: "right", padding: "14px 16px", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: user.role === "admin" ? T.gradient : T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: user.role === "admin" ? "#fff" : T.accent }}>{user.name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: T.text }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: user.role === "admin" ? "rgba(99,102,241,0.12)" : T.cyanBg, color: user.role === "admin" ? T.accent : T.cyan }}>{user.role === "admin" ? "Admin" : "Consultant"}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: user.status === "active" ? T.greenBg : T.redBg, color: user.status === "active" ? T.green : T.red }}>{user.status === "active" ? "Actif" : "Désactivé"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: T.textSecondary, fontSize: 12 }}>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <Btn size="sm" variant="ghost" onClick={() => handleResend(user)} title="Renvoyer invitation"><RefreshCw size={13} /></Btn>
                        <Btn size="sm" variant="ghost" onClick={() => handleToggleStatus(user)} title={user.status === "active" ? "Désactiver" : "Activer"}>
                          {user.status === "active" ? <Pause size={13} /> : <Play size={13} />}
                        </Btn>
                        {user.id !== authUser.id && <Btn size="sm" variant="danger" onClick={() => handleDelete(user)}><Trash2 size={13} /></Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Aucun utilisateur</div>}
          </div>
        )}
        </>}

        {/* ── ACTIVITY TAB ── */}
        {adminTab === "activity" && (
          statsLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Loader size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} /></div>
          ) : (
            <>
              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
                {activityStats.map(s => (
                  <div key={s.userId} onClick={() => loadUserActivity(s.userId)}
                    style={{ background: selectedUserId === s.userId ? `${T.accent}10` : T.bgCard, borderRadius: 14, padding: 18, border: `1px solid ${selectedUserId === s.userId ? T.accent : T.border}`, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.role === "admin" ? T.gradient : T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: s.role === "admin" ? "#fff" : T.accent }}>{s.userName?.charAt(0)?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{s.userName}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{s.email}</div>
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: s.status === "active" ? T.greenBg : T.redBg, color: s.status === "active" ? T.green : T.red }}>{s.status === "active" ? "Actif" : "Inactif"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div style={{ textAlign: "center", padding: "8px 4px", background: T.bgElevated, borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>{s.totalPublications}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Publications</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "8px 4px", background: T.bgElevated, borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{s.actionsLast7Days}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Actions 7j</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "8px 4px", background: T.bgElevated, borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.amber }}>{s.totalLogins}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Connexions</div>
                      </div>
                    </div>
                    {s.lastLogin && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>Dernière connexion : {new Date(s.lastLogin).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
                  </div>
                ))}
              </div>

              {/* Activity Log */}
              <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>
                    {selectedUserId ? `Activité de ${activityStats.find(s => s.userId === selectedUserId)?.userName || ""}` : "Journal d'activité global"}
                  </h3>
                  {selectedUserId && (
                    <button onClick={() => { setSelectedUserId(null); API.getActivity(null, 50).then(d => setActivityLog(d.activity || [])); }}
                      style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", color: T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      Voir tout
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 400, overflow: "auto" }}>
                  {activityLog.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>Aucune activité enregistrée pour le moment. L'activité apparaîtra ici dès que les utilisateurs commenceront à utiliser PostFlow.</div>
                  ) : (
                    activityLog.map(log => {
                      const a = ACTION_LABELS[log.action] || { label: log.action, icon: "📌", color: T.textMuted };
                      return (
                        <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: `1px solid ${T.border}08`, fontSize: 13 }}>
                          <span style={{ fontSize: 16 }}>{a.icon}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: T.text }}>{log.userName}</span>
                            <span style={{ color: T.textSecondary }}> — </span>
                            <span style={{ color: a.color, fontWeight: 500 }}>{a.label}</span>
                            {log.details?.textLength && <span style={{ color: T.textMuted, fontSize: 11 }}> ({log.details.textLength} car.)</span>}
                            {log.details?.newUser && <span style={{ color: T.textMuted, fontSize: 11 }}> → {log.details.newUser}</span>}
                          </div>
                          <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )
        )}        {adminTab === "tools" && (
          <div>
            {adminMsg && (
              <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 500, background: adminMsg.type === "success" ? T.greenBg : adminMsg.type === "error" ? T.redBg : T.amberBg, color: adminMsg.type === "success" ? T.green : adminMsg.type === "error" ? T.red : T.amber, border: `1px solid ${adminMsg.type === "success" ? T.green : adminMsg.type === "error" ? T.red : T.amber}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {adminMsg.text}
                <button onClick={() => setAdminMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16, padding: "0 4px" }}>&times;</button>
              </div>
            )}

            <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
                <RotateCcw size={18} color={T.red} /> Reinitialiser les donnees
              </h3>
              <p style={{ fontSize: 13, color: T.textSecondary, margin: "0 0 20px", lineHeight: 1.6 }}>
                Remet la base de donnees a zero : supprime tous les utilisateurs (sauf votre compte admin), efface tout l historique d activite et deconnecte tous les comptes LinkedIn. Utile pour repartir sur une base propre.
              </p>

              {!resetConfirm ? (
                <Btn variant="danger" onClick={() => setResetConfirm(true)}>
                  <RotateCcw size={14} /> Reinitialiser toutes les donnees
                </Btn>
              ) : (
                <div style={{ background: `${T.red}08`, border: `1px solid ${T.red}30`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <AlertTriangle size={20} color={T.red} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>Confirmer la reinitialisation</span>
                  </div>
                  <p style={{ fontSize: 13, color: T.textSecondary, margin: "0 0 16px" }}>
                    Cette action est irreversible. Toutes les donnees seront supprimees sauf votre compte administrateur.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn variant="secondary" onClick={() => setResetConfirm(false)}>Annuler</Btn>
                    <Btn variant="danger" onClick={handleReset} disabled={resetting}>
                      {resetting ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Reinitialisation...</> : <><Trash2 size={14} /> Oui, tout reinitialiser</>}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════
     MODALS
     ════════════════════════════════════════════════════════════════ */
  const modalsContent = (
    <>
      {showModal === "schedule" && (
        <Modal theme={T} title={modalData?.isNew ? "Programmer" : "Modifier"} onClose={() => setShowModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: 5 }}>Contenu</label>
              <textarea value={modalData?.content || ""} onChange={e => setModalData(d => ({ ...d, content: e.target.value }))}
                style={{ width: "100%", minHeight: 110, padding: 11, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, resize: "vertical", fontFamily: "Inter, sans-serif", lineHeight: 1.5, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: 4 }}>📅 Date</label><input type="date" value={schedForm.date} onChange={e => setSchedForm(s => ({ ...s, date: e.target.value }))} style={{ width: "100%", padding: 9, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, boxSizing: "border-box", fontFamily: "Inter, sans-serif" }} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: 4 }}>🕐 Heure</label><input type="time" value={schedForm.time} onChange={e => setSchedForm(s => ({ ...s, time: e.target.value }))} style={{ width: "100%", padding: 9, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, boxSizing: "border-box", fontFamily: "Inter, sans-serif" }} /></div>
            </div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: 4 }}>👤 Consultant</label>
              <select value={schedForm.author} onChange={e => setSchedForm(s => ({ ...s, author: e.target.value }))} style={{ width: "100%", padding: 9, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, boxSizing: "border-box", fontFamily: "Inter, sans-serif" }}>
                <option>Marco B.</option><option>Consultant 1</option><option>Consultant 2</option><option>Consultant 3</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="secondary" onClick={() => setShowModal(null)}>Annuler</Btn>
              {!modalData?.isNew && <Btn variant="danger" onClick={() => { deletePost(modalData.id); setShowModal(null); }}><Trash2 size={13} /></Btn>}
              <Btn variant="gradient" onClick={confirmSchedule}><Clock size={13} /> {modalData?.isNew ? "Programmer" : "Mettre à jour"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {showModal === "publish" && (
        <Modal theme={T} title="Publier maintenant" onClose={() => setShowModal(null)}>
          {!linkedinConnected ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <AlertCircle size={36} color={T.amber} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>LinkedIn non connecté</p>
              <p style={{ fontSize: 13, color: T.textSecondary, marginBottom: 16 }}>Connectez-vous pour publier</p>
              <Btn variant="gradient" onClick={() => setShowModal("linkedin")} style={{ width: "100%", justifyContent: "center" }}><Linkedin size={15} /> Connecter</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: T.greenBg, border: `1px solid rgba(34,197,94,0.2)`, borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color={T.green} /><span style={{ fontSize: 12, color: T.green }}>Connecté — {linkedinProfile.name}</span></div>
              <LinkedInPreview content={modalData?.content} imageUrl={modalData?.imageUrl} author={linkedinProfile.name} />
              <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
                <Btn variant="secondary" onClick={() => setShowModal(null)}>Annuler</Btn>
                <Btn variant="gradient" onClick={confirmPublishNow}><Send size={13} /> Publier</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}
      {showModal === "linkedin" && (
        <Modal theme={T} title="Connexion LinkedIn" onClose={() => setShowModal(null)}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #0077B5, #00A0DC)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Linkedin size={28} color="#fff" /></div>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>Connecter LinkedIn</h4>
            <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.5, marginBottom: 16, maxWidth: 360, margin: "0 auto 16px" }}>PostFlow utilise OAuth 2.0. Vos identifiants ne sont jamais stockés.</p>
            <div style={{ background: T.bgElevated, borderRadius: 10, padding: 14, marginBottom: 16, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Permissions :</div>
              {["Publier des posts", "Lire les statistiques", "Accéder au profil"].map(p => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, fontSize: 12, color: T.textSecondary }}><Check size={12} color={T.green} /> {p}</div>
              ))}
            </div>
            {linkedinConnected ? (
              <div>
                <div style={{ padding: 14, background: T.greenBg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 10 }}><CheckCircle2 size={16} color={T.green} /><span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>Connecté — {linkedinProfile.name}</span></div>
                <button onClick={disconnectLinkedin} style={{ width: "100%", padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: T.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  <Unlink size={13} style={{ marginRight: 6, verticalAlign: "middle" }} /> Déconnecter LinkedIn
                </button>
              </div>
            ) : (
              <button onClick={connectLinkedin} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #0077B5, #00A0DC)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 20px rgba(0,119,181,0.3)" }}>
                <Linkedin size={17} /> Se connecter avec LinkedIn
              </button>
            )}
          </div>
        </Modal>
      )}
      {showModal === "pexels" && (
        <Modal theme={T} title="Bibliothèque d'images" onClose={() => setShowModal(null)}>
          <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, padding: "8px 11px", background: T.bgInput, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <Search size={14} color={T.textMuted} />
              <input ref={pexelsInputRef} defaultValue={pexelsSearch} onKeyDown={e => e.key === "Enter" && searchPexels(e.target.value)} placeholder="Rechercher des photos..." style={{ background: "none", border: "none", color: T.text, fontSize: 13, outline: "none", width: "100%", fontFamily: "Inter, sans-serif" }} />
            </div>
            <Btn size="sm" onClick={() => searchPexels(pexelsInputRef.current?.value || pexelsSearch)}><Search size={13} /></Btn>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {["recrutement", "bureau", "équipe", "Outre-Mer tropical", "leadership", "entretien", "entreprise", "succès", "innovation", "diversité"].map(tag => (
              <button key={tag} onClick={() => { if (pexelsInputRef.current) pexelsInputRef.current.value = tag; searchPexels(tag); }}
                style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${pexelsSearch === tag ? T.accent + "60" : T.border}`, background: pexelsSearch === tag ? T.accentBg : "transparent", color: pexelsSearch === tag ? T.accentLight : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500, transition: "all 0.15s" }}>
                {tag}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
              <Upload size={12} /> Importer mon image
            </button>
            {pexelsTotalResults > 0 && <span style={{ fontSize: 11, color: T.textMuted }}>{pexelsTotalResults.toLocaleString()} résultats</span>}
          </div>
          {pexelsLoading ? (
            <div style={{ textAlign: "center", padding: 24 }}><Loader size={22} color={T.accent} style={{ animation: "spin 1s linear infinite" }} /><p style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>Recherche...</p></div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                {pexelsResults.map(img => (
                  <div key={img.id} onClick={() => { setGen(s => ({ ...s, selectedImage: img })); setShowModal(null); showNotification("Image sélectionnée !"); }}
                    style={{ borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <img src={img.src} alt={img.alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 5px", background: "rgba(0,0,0,0.7)", fontSize: 9, color: "#fff" }}>📷 {img.photographer}</div>
                  </div>
                ))}
              </div>
              {pexelsResults.length > 0 && pexelsTotalResults > pexelsResults.length && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <Btn variant="secondary" size="sm" onClick={() => searchPexels(pexelsSearch, pexelsPage + 1)} disabled={pexelsLoadingMore}>
                    {pexelsLoadingMore ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Chargement...</> : <><Plus size={12} /> Voir plus d'images ({pexelsResults.length}/{pexelsTotalResults > 999 ? "999+" : pexelsTotalResults})</>}
                  </Btn>
                </div>
              )}
            </>
          )}
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 10, textAlign: "center" }}>Photos libres de droits par <a href="https://www.pexels.com" target="_blank" rel="noreferrer" style={{ color: T.accent }}>Pexels</a></p>
        </Modal>
      )}
      {showModal === "template" && modalData && (
        <Modal theme={T} title={modalData.title} onClose={() => setShowModal(null)}>
          <LinkedInPreview content={modalData.content} />
          <div style={{ display: "flex", gap: 7, marginTop: 14, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => copyText(modalData.content)}><Copy size={13} /> Copier</Btn>
            <Btn variant="gradient" onClick={() => { useTemplate(modalData); setShowModal(null); }}><Sparkles size={13} /> Utiliser</Btn>
          </div>
        </Modal>
      )}
    </>
  );

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
  return (
    <ThemeCtx.Provider value={T}>
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T.text, overflow: "hidden", transition: "background 0.3s, color 0.3s" }}>
      <style>{globalCSS}</style>
      {sidebarContent}
      <main style={{ flex: 1, overflow: "auto", padding: "26px 30px" }}>
        {tab === "dashboard" && Dashboard()}
        {tab === "generator" && Generator()}
        {tab === "calendar" && CalendarPage()}
        {tab === "templates" && TemplatesPage()}
        {tab === "analytics" && AnalyticsPage()}
        {tab === "admin" && authUser.role === "admin" && <AdminPage key="admin-page" />}
        {tab === "settings" && SettingsPage()}
      </main>
      {modalsContent}
      {notif && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 2000, padding: "11px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, background: notif.type === "success" ? T.green : notif.type === "warning" ? T.amber : T.red, color: "#fff", boxShadow: T.shadowLg, animation: "slideIn 0.3s ease", fontFamily: "Inter, sans-serif" }}>
          {notif.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {notif.msg}
        </div>
      )}
    </div>
    </ThemeCtx.Provider>
  );
}
