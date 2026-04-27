/**
 * seedMenu.js — Peuple la base avec des plats d'exemple + photos réelles
 * Usage : node backend/scripts/seedMenu.js
 *
 * ✔ Sécurisé : utilise findOrCreate — jamais de doublons si relancé
 * ✔ Couvre toutes les catégories : Entrées, Plats principaux, Desserts,
 *   Boissons, Snacks, Menus spéciaux
 */

require('dotenv').config();
const { sequelize } = require('../models');
const MenuItem = require('../models/MenuItem');

// ─── Données de référence ────────────────────────────────────────────────────
const ITEMS = [

  // ════════════════════════════════
  //  PLATS PRINCIPAUX
  // ════════════════════════════════
  {
    name: 'Poulet frite avec riz',
    description: 'Délicieux poulet croustillant servi avec du riz blanc parfumé, tomates fraîches et légumes sautés.',
    price: 18000,
    category: 'Plats principaux',
    image: 'https://images.unsplash.com/photo-1773620494293-e9e075dd48fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
    preparationTime: 20,
    available: true,
    featured: true,
  },
  {
    name: 'Vary gasy (riz malgache)',
    description: 'Le classique riz malgache mijoté avec viande de bœuf en sauce, légumes de saison et épices traditionnelles.',
    price: 15000,
    category: 'Plats principaux',
    image: 'https://images.unsplash.com/photo-1773620494047-50cb58f59bc5?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
    preparationTime: 25,
    available: true,
    featured: true,
  },
  {
    name: 'Bœuf sauté au riz',
    description: 'Bœuf tendre sauté aux oignons caramélisés, servi sur un lit de riz jasmin parfumé.',
    price: 22000,
    category: 'Plats principaux',
    image: 'https://images.pexels.com/photos/19802119/pexels-photo-19802119.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 20,
    available: true,
    featured: false,
  },
  {
    name: 'Poulet braisé au four',
    description: 'Cuisse de poulet marinée aux herbes et épices, braisée au four, accompagnée de sa garniture.',
    price: 20000,
    category: 'Plats principaux',
    image: 'https://images.pexels.com/photos/8743924/pexels-photo-8743924.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 30,
    available: true,
    featured: false,
  },
  {
    name: 'Riz frit aux légumes',
    description: 'Riz sauté à la wok avec omelette, légumes croquants, sauce pimentée et crevettes.',
    price: 16000,
    category: 'Plats principaux',
    image: 'https://images.pexels.com/photos/32612771/pexels-photo-32612771.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 15,
    available: true,
    featured: false,
  },

  // ════════════════════════════════
  //  ENTRÉES
  // ════════════════════════════════
  {
    name: 'Salade caprese fraîche',
    description: 'Tomates mûres, mozzarella crémeuse, feuilles de basilic, filet d\'huile d\'olive et vinaigre balsamique.',
    price: 9000,
    category: 'Entrées',
    image: 'https://images.pexels.com/photos/8696570/pexels-photo-8696570.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 8,
    available: true,
    featured: false,
  },
  {
    name: 'Salade grecque classique',
    description: 'Concombres, tomates cerises, olives kalamata, feta, poivrons et oignons rouges à l\'huile d\'olive.',
    price: 10000,
    category: 'Entrées',
    image: 'https://images.pexels.com/photos/8697517/pexels-photo-8697517.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 8,
    available: true,
    featured: false,
  },
  {
    name: 'Salade fattoush colorée',
    description: 'Salade orientale fraîche avec légumes croquants, sumac, grenade et croûtons de pain grillé.',
    price: 11000,
    category: 'Entrées',
    image: 'https://images.pexels.com/photos/32986457/pexels-photo-32986457.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 10,
    available: true,
    featured: false,
  },

  // ════════════════════════════════
  //  BOISSONS
  // ════════════════════════════════
  {
    name: 'Jus de mangue frais',
    description: 'Mangues mûres pressées à froid, sans sucre ajouté, servi bien frais avec une paille.',
    price: 6000,
    category: 'Boissons',
    image: 'https://images.unsplash.com/photo-1708782343412-787fade27b60?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
    preparationTime: 5,
    available: true,
    featured: true,
  },
  {
    name: 'Jus d\'orange naturel',
    description: 'Oranges pressées minute, servies avec feuilles de menthe et quelques glaçons.',
    price: 5500,
    category: 'Boissons',
    image: 'https://images.pexels.com/photos/6416553/pexels-photo-6416553.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 5,
    available: true,
    featured: false,
  },
  {
    name: 'Cocktail agrumes tropical',
    description: 'Mélange rafraîchissant d\'orange sanguine, citron et pamplemousse avec sirop de canne.',
    price: 7500,
    category: 'Boissons',
    image: 'https://images.pexels.com/photos/36366987/pexels-photo-36366987.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 7,
    available: true,
    featured: false,
  },

  // ════════════════════════════════
  //  DESSERTS
  // ════════════════════════════════
  {
    name: 'Gâteau au chocolat',
    description: 'Fondant au chocolat noir intense, cœur coulant, servi avec une boule de glace vanille.',
    price: 8000,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1621868402792-a5c9fa6866a3?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
    preparationTime: 12,
    available: true,
    featured: true,
  },
  {
    name: 'Soufflé glacé caramel',
    description: 'Soufflé au chocolat couronné d\'une boule de glace vanille et nappé de caramel beurre salé.',
    price: 9500,
    category: 'Desserts',
    image: 'https://images.pexels.com/photos/13878328/pexels-photo-13878328.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 15,
    available: true,
    featured: false,
  },
  {
    name: 'Profiteroles maison',
    description: 'Choux à la crème garnis de crème pâtissière, nappés de sauce au chocolat chaud.',
    price: 8500,
    category: 'Desserts',
    image: 'https://images.pexels.com/photos/19963525/pexels-photo-19963525.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 10,
    available: true,
    featured: false,
  },

  // ════════════════════════════════
  //  SNACKS
  // ════════════════════════════════
  {
    name: 'Samosas épicés',
    description: 'Chaussons croustillants farcis aux légumes et épices, servis avec sauce chili et quartiers de citron vert.',
    price: 7000,
    category: 'Snacks',
    image: 'https://images.pexels.com/photos/8992923/pexels-photo-8992923.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 12,
    available: true,
    featured: false,
  },
  {
    name: 'Nems (rouleaux de printemps)',
    description: 'Nems croustillants fourrés poulet-légumes, servis sur lit de salade avec sauce soja sucrée.',
    price: 8000,
    category: 'Snacks',
    image: 'https://images.pexels.com/photos/37106473/pexels-photo-37106473.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 15,
    available: true,
    featured: false,
  },
  {
    name: 'Brochettes grillées',
    description: 'Brochettes de viande marinée, grillées au charbon de bois, servies avec sauce piment maison.',
    price: 12000,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1594999945795-e570338fdd12?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
    preparationTime: 18,
    available: true,
    featured: true,
  },

  // ════════════════════════════════
  //  MENUS SPÉCIAUX
  // ════════════════════════════════
  {
    name: 'Menu complet poulet & riz',
    description: 'Poulet rôti sur lit de riz aux lentilles, accompagné de salades fraîches et sauces pimentées.',
    price: 28000,
    category: 'Menus spéciaux',
    image: 'https://images.pexels.com/photos/17650171/pexels-photo-17650171.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 30,
    available: true,
    featured: true,
  },
  {
    name: 'Menu familial oriental',
    description: 'Grand plateau poulet et riz aux épices, légumes grillés, sauces variées — idéal pour 2 personnes.',
    price: 45000,
    category: 'Menus spéciaux',
    image: 'https://images.pexels.com/photos/17650208/pexels-photo-17650208.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 35,
    available: true,
    featured: true,
  },
  {
    name: 'Menu Nasi Lemak spécial',
    description: 'Riz au lait de coco, poulet frit croustillant, sambal épicé, œuf dur et cacahuètes grillées.',
    price: 32000,
    category: 'Menus spéciaux',
    image: 'https://images.pexels.com/photos/11912788/pexels-photo-11912788.jpeg?auto=compress&cs=tinysrgb&w=600',
    preparationTime: 30,
    available: true,
    featured: false,
  },
];

// ─── Exécution du seed ────────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base OK');

    let created = 0;
    let skipped = 0;

    for (const item of ITEMS) {
      try {
        const existing = await MenuItem.findOne({ where: { name: item.name } });
        if (!existing) {
          await MenuItem.create(item);
          console.log(`  ➕ Créé : "${item.name}" [${item.category}]`);
          created++;
        } else if (!existing.image || existing.image.trim() === '') {
          await MenuItem.update({ image: item.image }, { where: { id: existing.id } });
          console.log(`  🖼  Image ajoutée : "${item.name}"`);
          created++;
        } else {
          console.log(`  ⏭  Existe déjà  : "${item.name}"`);
          skipped++;
        }
      } catch (itemErr) {
        console.error(`  ❌ Erreur pour "${item.name}" : ${itemErr.message}`);
      }
    }

    console.log(`\n✅ Seed terminé — ${created} plat(s) créés/mis à jour, ${skipped} ignorés.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seed :', err.message);
    process.exit(1);
  }
})();
