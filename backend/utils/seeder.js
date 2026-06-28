const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Story = require('../models/Story');
const Category = require('../models/Category');
const { Achievement } = require('../models/index');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mythlok';

const categories = [
  { name: 'Ghost Stories',           slug: 'ghost-stories',           icon: '👻', color: '#4A0E8F', description: 'Haunted places, spirits, and supernatural encounters across India.' },
  { name: 'Mythological Creatures',  slug: 'mythological-creatures',  icon: '🐉', color: '#8B1A1A', description: 'Legendary beasts, divine beings, and magical entities.' },
  { name: 'Tribal Legends',          slug: 'tribal-legends',          icon: '🪘', color: '#5D4E37', description: 'Ancient stories passed down by tribal communities.' },
  { name: 'Sacred Places',           slug: 'sacred-places',           icon: '🛕', color: '#C17900', description: 'Holy sites, temples, and places of spiritual power.' },
  { name: 'Folk Tales',              slug: 'folk-tales',              icon: '📜', color: '#1A5276', description: 'Traditional stories of everyday heroes and magical encounters.' },
  { name: 'Demigods & Heroes',       slug: 'demigods-heroes',         icon: '⚔️', color: '#1E8449', description: 'Legends of mighty warriors and divine heroes.' },
  { name: 'Nature Spirits',          slug: 'nature-spirits',          icon: '🌿', color: '#117A65', description: 'Spirits of rivers, forests, mountains, and natural elements.' },
  { name: 'Cursed Places',           slug: 'cursed-places',           icon: '⛓️', color: '#641E16', description: 'Sites bearing ancient curses, warnings, and dark histories.' },
];

const achievements = [
  { key: 'first_read',    title: 'First Tale',         description: 'Read your first story',         icon: '📖', xpValue: 5,   condition: { type: 'stories_read',     threshold: 1 } },
  { key: 'read_10',       title: 'Story Seeker',       description: 'Read 10 stories',               icon: '🔍', xpValue: 15,  condition: { type: 'stories_read',     threshold: 10 } },
  { key: 'read_50',       title: 'Myth Keeper',        description: 'Read 50 stories',               icon: '🗺️', xpValue: 50,  condition: { type: 'stories_read',     threshold: 50 } },
  { key: 'read_100',      title: 'Legend Archivist',   description: 'Read 100 stories',              icon: '🏛️', xpValue: 100, condition: { type: 'stories_read',     threshold: 100 } },
  { key: 'explore_5',     title: 'State Wanderer',     description: 'Explore stories from 5 states', icon: '🧭', xpValue: 20,  condition: { type: 'states_explored',  threshold: 5 } },
  { key: 'explore_15',    title: 'Desh Yatri',         description: 'Explore 15 states',             icon: '🗺️', xpValue: 60,  condition: { type: 'states_explored',  threshold: 15 } },
  { key: 'explore_all',   title: 'Bharata Explorer',   description: 'Stories from every state',      icon: '🇮🇳', xpValue: 200, condition: { type: 'states_explored',  threshold: 28 } },
  { key: 'first_story',   title: 'Voice of the Past',  description: 'Submit your first story',       icon: '✍️', xpValue: 25,  condition: { type: 'stories_written',  threshold: 1 } },
  { key: 'write_10',      title: 'Story Weaver',       description: 'Submit 10 stories',             icon: '🕸️', xpValue: 75,  condition: { type: 'stories_written',  threshold: 10 } },
  { key: 'likes_100',     title: 'Beloved Narrator',   description: 'Receive 100 likes',             icon: '❤️', xpValue: 50,  condition: { type: 'likes_received',   threshold: 100 } },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Story.deleteMany({}),
      Category.deleteMany({}),
      Achievement.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Seed categories
    const cats = await Category.insertMany(categories);
    console.log(`✅ Seeded ${cats.length} categories`);

    // Seed achievements
    await Achievement.insertMany(achievements);
    console.log(`✅ Seeded ${achievements.length} achievements`);

    // Seed users
    const adminUser = await User.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@mythlok.com',
      password: 'Admin@123',
      role: 'admin',
      bio: 'MythLok platform administrator.',
    });

    const contributor = await User.create({
      name: 'Arjun Sharma',
      username: 'arjunsharma',
      email: 'arjun@mythlok.com',
      password: 'User@123',
      role: 'contributor',
      bio: 'Folklore researcher from Rajasthan, passionate about preserving oral traditions.',
      state: 'Rajasthan',
      storiesWritten: 3,
    });

    const user1 = await User.create({
      name: 'Priya Nair',
      username: 'priyanair',
      email: 'priya@mythlok.com',
      password: 'User@123',
      role: 'user',
      bio: 'Kerala native fascinated by South Indian mythology.',
      storiesRead: 12,
    });

    console.log('✅ Seeded 3 users');

    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c._id);

    // Seed stories
    const stories = [
      {
        title: 'Bhangarh Fort: India\'s Most Haunted Place',
        alternativeNames: ['Bhangad', 'The Cursed Citadel'],
        state: 'Rajasthan',
        district: 'Alwar',
        category: catMap['cursed-places'],
        shortDescription: 'A 17th-century fort abandoned after a sorcerer\'s curse, where no one dares stay past sunset — not even the government allows overnight stays.',
        fullStory: `Built in 1573 by Bhagwant Das for his son Madho Singh, Bhangarh Fort stands as a magnificent ruin in the Aravalli Hills of Rajasthan. But beneath its historical grandeur lies a chilling legend that has made it the most feared place in India.

The most popular legend revolves around Singhia, a powerful tantric who fell hopelessly in love with the beautiful Princess Ratnavati of Bhangarh. Knowing he could never win her heart through normal means, Singhia decided to use black magic. He cast a spell on the perfumed oil the princess had purchased, hoping it would make her fall under his control.

However, the princess was wise and sensed the dark enchantment. She threw the oil onto a large boulder nearby, which immediately began to roll toward Singhia, crushing him to death. But before he died, the sorcerer uttered a terrible curse: that Bhangarh would be destroyed and all its inhabitants would die, doomed to walk the earth as restless spirits unable to be reborn.

Shortly after, a battle broke out. The entire population of Bhangarh — including Princess Ratnavati — was killed. The fort was abandoned, and no one has ever successfully settled there since.

The Archaeological Survey of India has placed an unusual warning board at the fort's entrance: "Staying after sunset is strictly prohibited." Local villagers refuse to build homes taller than the ruins, believing the spirits will punish them.

Visitors report hearing unexplained sounds, experiencing cold spots, and seeing shadowy figures near the ancient temples within the fort grounds. Paranormal investigators from around the world have documented equipment malfunctions and unexplained temperature anomalies.`,
        origin: 'The legend dates to 1573 CE during the reign of Madho Singh, son of Raja Bhagwant Das of the Kachwaha clan. The fort served as a thriving city before being abandoned in the early 18th century.',
        significance: 'Bhangarh remains one of the few places in India officially acknowledged by the government as paranormally active. It represents the complex interplay between historical tragedy and supernatural belief in Rajasthani culture.',
        tags: ['bhangarh', 'fort', 'haunted', 'rajasthan', 'ghost', 'curse', 'princess', 'tantric'],
        contributor: contributor._id,
        status: 'approved',
        isFeatured: true,
        views: 8420,
        averageRating: 4.7,
        totalRatings: 243,
      },
      {
        title: 'Nale Ba: The Ghost Who Calls Your Name',
        alternativeNames: ['Come Tomorrow', 'Nale Baa'],
        state: 'Karnataka',
        district: 'Bangalore',
        category: catMap['ghost-stories'],
        shortDescription: 'In 1990s Bangalore, people wrote "Nale Ba" (Come Tomorrow) on their doors to ward off a female ghost who killed anyone who answered her knock at night.',
        fullStory: `In the early 1990s, a mass hysteria gripped Bangalore that remains one of the most fascinating episodes of collective folklore in modern India. The legend of "Nale Ba" — Kannada for "Come Tomorrow" — spread through the city like wildfire, prompting thousands of households to scrawl these two words on their doors.

The legend spoke of a female ghost — described as a witch or churel — who roamed residential areas at night. She would knock on doors and call out in the voice of a loved one: a mother, sister, or wife. If anyone inside answered or opened the door, they would be struck dead before dawn.

But she was bound by rules, as all powerful spirits are. If she saw the words "Nale Ba" written on the door, she was compelled to come back the following night — and the night after that — forever postponing her deadly visit.

The rumor spread faster than any newspaper headline. Chalk inscriptions appeared on walls, doors, and gates across Bangalore, Mysore, and surrounding towns. Even educated, urban households participated — not because they truly believed, but because the price of skepticism felt too high.

Folklorists who studied the phenomenon noted it mirrored ancient apotropaic traditions — the use of written words to ward off evil — found across many world cultures. The Nale Ba panic was unique in being a living, viral piece of folklore in a modern city, predating the internet age entirely.

Today, faded "Nale Ba" inscriptions can still be found on old walls in parts of Bangalore, silent witnesses to a collective dream of fear and protection.`,
        origin: 'The Nale Ba phenomenon emerged circa 1990-1995 in Bangalore, Karnataka. Its exact origin is unknown — the legend seemed to emerge spontaneously from multiple sources simultaneously, a true example of communal folklore creation.',
        significance: 'Nale Ba represents one of India\'s most documented cases of urban folklore panic. It demonstrates how ancient supernatural beliefs adapt to modern settings and how communities create collective protective rituals during times of anxiety.',
        tags: ['nale ba', 'karnataka', 'bangalore', 'ghost', 'witch', 'churel', '1990s', 'urban legend'],
        contributor: contributor._id,
        status: 'approved',
        isFeatured: true,
        views: 6240,
        averageRating: 4.5,
        totalRatings: 187,
      },
      {
        title: 'Vetala: The Undead Storyteller of Ancient India',
        alternativeNames: ['Baital', 'Vetal', 'Vetala of Vikramaditya'],
        state: 'Madhya Pradesh',
        district: 'Ujjain',
        category: catMap['mythological-creatures'],
        shortDescription: 'An ancient undead being that inhabits corpses, the Vetala tested King Vikramaditya\'s wisdom through 25 riddles across Indian mythology\'s most beloved puzzle tales.',
        fullStory: `In the treasury of Sanskrit literature, few figures are as philosophically rich as the Vetala — a supernatural entity that occupies the bodies of the recently deceased, animating them with its ancient consciousness.

Unlike demons that seek destruction, the Vetala occupies a unique space: it is a keeper of knowledge, a tester of wisdom, and a deeply ambivalent force in the moral universe.

The most famous appearance of the Vetala comes in the Baital Pachisi — the Twenty-Five Tales of the Undead — a collection attributed to the court of the legendary King Vikramaditya of Ujjain. A tantric sage sends Vikramaditya on an impossible task: retrieve a Vetala hanging from a tree in a cremation ground and bring it back without speaking.

But the Vetala is the greatest storyteller of the underworld. Each time Vikramaditya carries it, the Vetala tells a story ending with a moral riddle. If the king knows the answer and remains silent, his head will shatter. So Vikramaditya must answer — and the moment he does, the Vetala flies back to its tree. This cycle repeats through 24 tales.

In these stories, the Vetala probes the deepest questions: Who truly loves? Who deserves justice? What makes a decision righteous? Its tales are sophisticated moral philosophy disguised as horror.

The physical description of the Vetala varies across texts: sometimes gaunt and grey, sometimes appearing perfectly normal save for its backwards feet — a common marker of supernatural beings in South Asian folklore. It is repelled by mantras and sacred fire, and can be permanently laid to rest only through proper funeral rites for the corpse it inhabits.`,
        origin: 'The Vetala appears in ancient Sanskrit texts including the Kathāsaritsāgara (Ocean of the Streams of Story) compiled in the 11th century CE by Somadeva. The Baital Pachisi tales are believed to derive from even older oral traditions.',
        significance: 'The Vetala represents a sophisticated philosophical tradition within Indian horror folklore — one that uses supernatural horror as a vehicle for ethical inquiry. It influenced countless storytelling traditions across Asia.',
        tags: ['vetala', 'baital', 'vikramaditya', 'ujjain', 'undead', 'sanskrit', 'mythology', 'riddles'],
        contributor: adminUser._id,
        status: 'approved',
        isFeatured: true,
        views: 5180,
        averageRating: 4.8,
        totalRatings: 156,
      },
      {
        title: 'The Nagas of Nagaland: Serpent Ancestors of the Hill People',
        alternativeNames: ['Naga Spirits', 'Serpent Clan', 'Dragon Ancestors'],
        state: 'Nagaland',
        district: 'Kohima',
        category: catMap['tribal-legends'],
        shortDescription: 'The Naga tribes of Northeast India trace their ancestry to giant serpents, with traditions, tattoos, and morungs that still carry the power of their serpentine forebears.',
        fullStory: `Long before the written word reached the hills of Northeast India, the Naga peoples carried their history in song, dance, and the ink pressed into their skin. And at the heart of many Naga origin myths coils a great serpent — ancient, powerful, and kin.

Different Naga tribes hold different variations of the origin story. Among the Angami Nagas, the ancestor emerged from beneath the earth where a great serpent-spirit dwelled. The people took strength from this bond, and their warriors earned the right to wear the hornbill feather and the serpent tattoo only after proving themselves in battle.

The Naga tradition of head-hunting — now long abandoned — was deeply tied to serpent mythology. The head was believed to contain the soul's power, and rituals surrounding head-hunting involved prayers to serpent spirits for protection and victory. The morung — the traditional dormitory and meeting hall of Naga villages — was often decorated with carved serpents along the posts and beams, guardian spirits watching over the young men who slept and trained within.

Among the Konyak Nagas, certain lineages were said to have the power to call rain by invoking their serpent ancestors. Drought would bring the village elders to specific stones or pools where the serpent spirits were believed to rest, and they would make offerings of rice beer, eggs, and flowers.

Even today, the serpent motif appears in Naga shawls, jewelry, and tattoos. Young people learning traditional crafts are taught that these patterns are not merely decoration — they are conversations with ancestors who slithered before humanity walked upright.`,
        origin: 'Naga oral traditions date back millennia, predating written records. The serpent mythology is pan-Naga but varies significantly between the 16+ major tribes including Angami, Ao, Sumi, Konyak, Lotha, and others.',
        significance: 'Naga serpent mythology represents one of India\'s richest indigenous knowledge systems. It connects ecological observation (snakes as symbols of rebirth through shedding) with social structure and spiritual practice.',
        tags: ['naga', 'nagaland', 'tribal', 'serpent', 'northeast india', 'morung', 'tattoo', 'ancestor'],
        contributor: contributor._id,
        status: 'approved',
        views: 3240,
        averageRating: 4.6,
        totalRatings: 98,
      },
      {
        title: 'Padmanabhaswamy Temple: The Vault That Cannot Be Opened',
        alternativeNames: ['The Forbidden Chamber', 'Vault B', 'Temple of Endless Treasure'],
        state: 'Kerala',
        district: 'Thiruvananthapuram',
        category: catMap['sacred-places'],
        shortDescription: 'A 16th-century temple with underground vaults holding billions in treasure — but one vault, sealed by a cobra-inscribed door, is believed to bring catastrophe if opened.',
        fullStory: `Beneath the golden gopuram of Padmanabhaswamy Temple in Thiruvananthapuram lies one of the greatest mysteries of the ancient world: Vault B, a chamber sealed not by locks, but by belief, tradition, and the image of two cobras carved into its door.

When the Supreme Court of India ordered the temple's vaults opened in 2011, what emerged from Vaults A, C, D, E, and F stunned the world: gold coins dating to Roman times, diamond-studded crowns, thousands of gold statues, precious gems of unimaginable quantity — valuables estimated at over ₹1 lakh crore (approximately $15 billion), making it the richest temple on earth.

But Vault B remained sealed.

The reason is not legal or administrative — it is spiritual. Temple priests and the Travancore royal family believe the vault is protected by the nagas — divine serpents who serve Lord Vishnu, the reclining deity of the temple. The door bears cobra imagery, and tradition holds that only a specific ancient chant — a naga bandham — sealed it centuries ago. Only another naga bandham performed by siddha priests of an unbroken lineage can safely open it.

Attempts to override this through court orders were met with fierce opposition. Petitioners argued that the vault's contents belong to India. Defenders countered that some forms of knowledge — and some doors — exist outside human jurisdiction.

What does Vault B contain? The legends speak of a tunnel to the sea, a cobra-guarded inner chamber, and treasures accumulated over two millennia by the kings of Travancore, who considered themselves servants of Lord Vishnu and deposited their wealth at his feet. Some say it holds artifacts from the Indus Valley civilization itself.

As of this writing, Vault B remains sealed. The cobras on the door have not moved.`,
        origin: 'The Padmanabhaswamy Temple dates in its current form to the 16th century, though the site is believed sacred for over 5,000 years. The Travancore royal family served as hereditary guardians of the temple.',
        significance: 'The sealed vault represents the intersection of ancient spiritual tradition, national legal authority, and human curiosity about the past. It is a living mystery that forces modern India to confront the limits of secular governance over sacred space.',
        tags: ['padmanabhaswamy', 'kerala', 'vault', 'cobra', 'treasure', 'vishnu', 'travancore', 'temple', 'naga'],
        contributor: adminUser._id,
        status: 'approved',
        isFeatured: true,
        views: 9820,
        averageRating: 4.9,
        totalRatings: 312,
      },
    ];

    const createdStories = [];
    for (const s of stories) {
      const doc = await Story.create(s);
      createdStories.push(doc);
    }
    console.log(`✅ Seeded ${createdStories.length} stories`);

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────────────');
    console.log('Admin Login:       admin@mythlok.com / Admin@123');
    console.log('Contributor Login: arjun@mythlok.com / User@123');
    console.log('User Login:        priya@mythlok.com / User@123');
    console.log('─────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

seed();
