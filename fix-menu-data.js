const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.DB_URI;
const Menu = require('./models/Menu');

async function fixMenuData() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const menus = await Menu.find();
        console.log(`Found ${menus.length} menu documents`);

        for (const menu of menus) {
            let needsUpdate = false;

            // Fix addOns - convert strings to objects
            if (menu.addOns && Array.isArray(menu.addOns)) {
                const fixedAddOns = menu.addOns.map(addOn => {
                    if (typeof addOn === 'string') {
                        needsUpdate = true;
                        return { name: addOn, available: true };
                    }
                    return addOn;
                });

                if (needsUpdate) {
                    menu.addOns = fixedAddOns;
                    console.log(`Fixed addOns for menu: ${menu._id}`);
                }
            }

            // Fix categories items - ensure they have available property
            if (menu.categories && Array.isArray(menu.categories)) {
                menu.categories = menu.categories.map(cat => {
                    if (cat.items && Array.isArray(cat.items)) {
                        cat.items = cat.items.map(item => {
                            if (typeof item === 'string') {
                                needsUpdate = true;
                                return { name: item, available: true };
                            }
                            return item;
                        });
                    }
                    return cat;
                });
            }

            // Fix sugarLevels - convert numbers to objects
            if (menu.sugarLevels && Array.isArray(menu.sugarLevels)) {
                const fixedSugarLevels = menu.sugarLevels.map(level => {
                    if (typeof level === 'number') {
                        needsUpdate = true;
                        return { level: level, available: true };
                    }
                    return level;
                });

                if (needsUpdate) {
                    menu.sugarLevels = fixedSugarLevels;
                    console.log(`Fixed sugarLevels for menu: ${menu._id}`);
                }
            }

            if (needsUpdate) {
                await menu.save();
                console.log(`Updated menu: ${menu._id}`);
            }
        }

        console.log('Menu data fix completed');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error fixing menu data:', error);
    }
}

fixMenuData();