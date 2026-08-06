import User       from '../models/User.js';
import AuditLog   from '../models/AuditLog.js';
import Driver     from '../models/Driver.js';
import Vehicle    from '../models/Vehicle.js';
import Customer   from '../models/Customer.js';
import Waybill    from '../models/Waybill.js';
import Manifest   from '../models/Manifest.js';
import CustomerType from '../models/CustomerType.js';
import Branch     from '../models/Branch.js';
import Route      from '../models/Route.js';
import Counter    from '../models/Counter.js';
import Contractor from '../models/Contractor.js';

/** volumetric weight: L × W × H ÷ 5000 */
const volWeight = (l = 0, w = 0, h = 0) => (l * w * h) / 5000;

/**
 * Seeds the default Super Admin user and all operational mock data.
 * Every block is idempotent — safe to call on every server restart.
 */
const seedAdmin = async () => {
  try {

    // ── 1. Default Super Admin ──────────────────────────────────────────────
    const adminEmail = 'admin@freightflow.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log('[SEED] Creating default administrator...');
      admin = new User({
        fullName:   'Super Admin',
        email:      adminEmail,
        username:   'admin',
        password:   'Admin@123',           // hashed by pre-save hook
        role:       'Super Admin',
        department: 'Executive',
        status:     'Active',
      });
      await admin.save();
      await AuditLog.create({
        event:   'USER_CREATED',
        message: `Default administrator seeded: ${adminEmail}`,
        details: { email: adminEmail, role: 'Super Admin' },
      });
      console.log('[SEED] Default administrator created.');
    }

    // ── 2. Customer Types ────────────────────────────────────────────────────
    const customerTypeDefs = [
      { code: 'CORP',  name: 'Corporate',   description: 'Large corporate companies' },
      { code: 'IND',   name: 'Individual',  description: 'Individual customers' },
      { code: 'GOVT',  name: 'Government',  description: 'Government departments & parastatals' },
      { code: 'SME',   name: 'SME',         description: 'Small and medium enterprises' },
      { code: 'RETAIL',name: 'Retail',      description: 'Retail businesses' },
      { code: 'WHSL',  name: 'Wholesale',   description: 'Wholesale distributors' },
      { code: 'NGO',   name: 'NGO',         description: 'Non-governmental organisations' },
    ];

    for (const def of customerTypeDefs) {
      const exists = await CustomerType.findOne({ code: def.code });
      if (!exists) {
        await CustomerType.create({ ...def, status: 'Active', createdBy: admin._id });
        console.log(`[SEED] Customer Type created: ${def.name}`);
      }
    }

    // ── 3. Branches ───────────────────────────────────────────────────────────
    const branchDefs = [
      { name: 'Johannesburg',  code: 'JHB', city: 'Johannesburg', province: 'Gauteng',       address: '1 Freight Road, Johannesburg, 2001',    isHeadOffice: true  },
      { name: 'Cape Town',     code: 'CPT', city: 'Cape Town',    province: 'Western Cape',   address: '8 Harbour Drive, Cape Town, 8001',      isHeadOffice: false },
      { name: 'Durban',        code: 'DBN', city: 'Durban',       province: 'KwaZulu-Natal',  address: '15 Port Road, Durban, 4001',            isHeadOffice: false },
      { name: 'Pretoria',      code: 'PTA', city: 'Pretoria',     province: 'Gauteng',        address: '22 Church Street, Pretoria, 0001',      isHeadOffice: false },
      { name: 'Port Elizabeth', code: 'PE', city: 'Gqeberha',     province: 'Eastern Cape',   address: '5 Industrial Ave, Gqeberha, 6001',      isHeadOffice: false },
    ];

    const branchMap = {};
    for (const def of branchDefs) {
      let branch = await Branch.findOne({ code: def.code });
      if (!branch) {
        branch = await Branch.create({
          ...def,
          country:     'South Africa',
          status:      'Active',
          createdBy:   admin._id,
        });
        console.log(`[SEED] Branch created: ${def.name}`);
      }
      branchMap[def.code] = branch;
    }

    // ── 3. Routes ────────────────────────────────────────────────────────────
    const routeDefs = [
      { name: 'JHB - PTA', code: 'JHB-PTA', origin: 'Johannesburg', destination: 'Pretoria',      originCode: 'JHB', destCode: 'PTA', distanceKm: 56,  estimatedHours: 1.5 },
      { name: 'JHB - DBN', code: 'JHB-DBN', origin: 'Johannesburg', destination: 'Durban',         originCode: 'JHB', destCode: 'DBN', distanceKm: 585, estimatedHours: 6   },
      { name: 'JHB - CPT', code: 'JHB-CPT', origin: 'Johannesburg', destination: 'Cape Town',      originCode: 'JHB', destCode: 'CPT', distanceKm: 1404,estimatedHours: 14  },
      { name: 'JHB - PE',  code: 'JHB-PE',  origin: 'Johannesburg', destination: 'Port Elizabeth', originCode: 'JHB', destCode: 'PE',  distanceKm: 1050,estimatedHours: 11  },
      { name: 'DBN - CPT', code: 'DBN-CPT', origin: 'Durban',        destination: 'Cape Town',     originCode: 'DBN', destCode: 'CPT', distanceKm: 1750,estimatedHours: 18  },
    ];

    const routeMap = {};
    for (const def of routeDefs) {
      let route = await Route.findOne({ code: def.code });
      if (!route) {
        route = await Route.create({
          name:               def.name,
          code:               def.code,
          origin:             def.origin,
          destination:        def.destination,
          originBranch:       branchMap[def.originCode]?._id,
          destinationBranch:  branchMap[def.destCode]?._id,
          distanceKm:         def.distanceKm,
          estimatedHours:     def.estimatedHours,
          status:             'Active',
          createdBy:          admin._id,
        });
        console.log(`[SEED] Route created: ${def.name}`);
      }
      routeMap[def.code] = route;
    }

    // ── 4. Contractors ───────────────────────────────────────────────────────
    const contractorDefs = [
      {
        name:            'Swift Haul CC',
        contactPerson:   'Deon Venter',
        phoneNumber:     '011 888 1234',
        email:           'deon@swifthaul.co.za',
        address:         '7 Logistics Park, Johannesburg',
        serviceRegions:  ['Gauteng', 'KwaZulu-Natal'],
        vehicleTypes:    ['Truck', 'Van'],
        ratePerKm:       14.50,
        status:          'Active',
      },
      {
        name:            'Cape Link Transport',
        contactPerson:   'Marina de Wet',
        phoneNumber:     '021 777 5678',
        email:           'marina@capelink.co.za',
        address:         '3 Haulage Rd, Cape Town',
        serviceRegions:  ['Western Cape'],
        vehicleTypes:    ['Truck'],
        ratePerKm:       16.00,
        status:          'Active',
      },
      {
        name:            'Durban Coastal Couriers',
        contactPerson:   'Raj Pillay',
        phoneNumber:     '031 555 9999',
        email:           'raj@dcc.co.za',
        address:         '12 Port Access Rd, Durban',
        serviceRegions:  ['KwaZulu-Natal'],
        vehicleTypes:    ['Van', 'Bakkie'],
        ratePerKm:       12.00,
        status:          'Active',
      },
    ];

    for (const def of contractorDefs) {
      const exists = await Contractor.findOne({ name: def.name });
      if (!exists) {
        await Contractor.create({ ...def, createdBy: admin._id });
        console.log(`[SEED] Contractor created: ${def.name}`);
      }
    }

    // ── 5. Customers ─────────────────────────────────────────────────────────
    const custMap = {};
    const customerDefs = [
      { name: 'Alpha Pty Ltd',  pickupPoints: ['JHB Warehouse', 'Alpha Depot - Midrand'], contact: '011 555 0101', email: 'ops@alpha.co.za',       address: '12 Industrial Rd, Johannesburg, 2001', wechat: 'alpha_logistics' },
      { name: 'Metro DC',       pickupPoints: ['DBN Warehouse'],                          contact: '031 555 0202', email: 'dispatch@metrodc.co.za',  address: '8 Harbour Ave, Durban, 4001',          wechat: 'metro_dc_wx'     },
      { name: 'BuildCo SA',     pickupPoints: ['CT DC Main Rd', 'BuildCo Yard - Epping'], contact: '021 555 0303', email: 'logistics@buildco.co.za', address: '45 Epping Ave, Cape Town, 7460',       wechat: 'buildco_sa'      },
    ];

    for (const def of customerDefs) {
      let cust = await Customer.findOne({ name: def.name });
      if (!cust) {
        cust = await Customer.create({ ...def, status: 'Active' });
        console.log(`[SEED] Customer created: ${def.name}`);
      }
      custMap[def.name] = cust;
    }

    // ── 6. Driver Users ──────────────────────────────────────────────────────
    const driverUserDefs = [
      { fullName: 'John Dube',    email: 'john.dube@freightflow.com',    username: 'driver.john',   password: 'Driver@123' },
      { fullName: 'Sipho Nkosi',  email: 'sipho.nkosi@freightflow.com',  username: 'driver.sipho',  password: 'Driver@123' },
      { fullName: 'Pieter Botha', email: 'pieter.botha@freightflow.com', username: 'driver.pieter', password: 'Driver@123' },
    ];

    const driverUserMap = {};
    for (const def of driverUserDefs) {
      let u = await User.findOne({ username: def.username });
      if (!u) {
        u = new User({ ...def, role: 'Driver', department: 'Logistics', status: 'Active' });
        await u.save();
        console.log(`[SEED] Driver user created: ${def.username}`);
      }
      driverUserMap[def.username] = u;
    }

    // ── 7. Vehicles ──────────────────────────────────────────────────────────
    const vehicleMap = {};
    const vehicleDefs = [
      { registrationNumber: 'CAA 125 GP', make: 'Volvo',         model: 'FH16',   year: 2020, vehicleType: 'Truck', capacity: 25000, fuelType: 'Diesel' },
      { registrationNumber: 'CAA 448 GP', make: 'Scania',        model: 'R500',   year: 2021, vehicleType: 'Truck', capacity: 28000, fuelType: 'Diesel' },
      { registrationNumber: 'CAA 706 GP', make: 'Mercedes-Benz', model: 'Actros', year: 2019, vehicleType: 'Truck', capacity: 26000, fuelType: 'Diesel' },
    ];

    for (const def of vehicleDefs) {
      let v = await Vehicle.findOne({ registrationNumber: def.registrationNumber });
      if (!v) {
        v = await Vehicle.create({ ...def, branch: branchMap['JHB']?._id, status: 'Active', createdBy: admin._id });
        console.log(`[SEED] Vehicle created: ${def.registrationNumber}`);
      }
      vehicleMap[def.registrationNumber] = v;
    }

    // ── 8. Drivers ───────────────────────────────────────────────────────────
    const driverMap = {};
    const driverDefs = [
      { username: 'driver.john',   licenseNumber: 'DL-001', licenseType: 'Code 14', phoneNumber: '+27821112222', email: 'john.dube@freightflow.com',    idNumber: '8001015001085', status: 'On Trip',   regNo: 'CAA 125 GP' },
      { username: 'driver.sipho',  licenseNumber: 'DL-002', licenseType: 'Code 14', phoneNumber: '+27832223333', email: 'sipho.nkosi@freightflow.com',  idNumber: '8203125002083', status: 'On Trip',   regNo: 'CAA 448 GP' },
      { username: 'driver.pieter', licenseNumber: 'DL-003', licenseType: 'Code 14', phoneNumber: '+27843334444', email: 'pieter.botha@freightflow.com', idNumber: '7905065003081', status: 'Available', regNo: 'CAA 706 GP' },
    ];

    for (const def of driverDefs) {
      let d = await Driver.findOne({ licenseNumber: def.licenseNumber });
      if (!d) {
        const userRef = driverUserMap[def.username];
        const veh = vehicleMap[def.regNo];
        d = await Driver.create({
          userId:         userRef._id,
          fullName:       userRef.fullName,
          idNumber:       def.idNumber,
          licenseNumber:  def.licenseNumber,
          licenseType:    def.licenseType,
          phoneNumber:    def.phoneNumber,
          email:          def.email,
          status:         def.status,
          currentVehicle: veh._id,
          branch:         branchMap['JHB']?._id,
          createdBy:      admin._id,
        });
        // Link vehicle -> driver
        await Vehicle.findByIdAndUpdate(veh._id, { currentDriver: d._id });
        console.log(`[SEED] Driver created: ${userRef.fullName}`);
      }
      driverMap[def.licenseNumber] = d;
    }

    // ── 9. Waybills ──────────────────────────────────────────────────────────
    const waybillCount = await Waybill.countDocuments({});
    if (waybillCount === 0) {
      console.log('[SEED] Seeding waybills & manifests...');

      // Initialise counters
      await Counter.updateOne({ id: 'waybill'  }, { $setOnInsert: { seq: 0 } }, { upsert: true });
      await Counter.updateOne({ id: 'product'  }, { $setOnInsert: { seq: 0 } }, { upsert: true });
      await Counter.updateOne({ id: 'manifest' }, { $setOnInsert: { seq: 0 } }, { upsert: true });

      const alpha  = custMap['Alpha Pty Ltd'];
      const metro  = custMap['Metro DC'];
      const build  = custMap['BuildCo SA'];

      // ── Waybill 1 ──
      const wb1 = await Waybill.create({
        waybillNo: 'WB000001', productCode: 'PC000001', date: new Date(),
        sender: alpha.name, pickupPoint: alpha.pickupPoints[0],
        senderContact: alpha.contact, senderEmail: alpha.email,
        senderAddress: alpha.address, senderWechat: alpha.wechat,
        extraCharges: 'R150.00',
        receiver: 'Gareth Smith', deliveryPoint: 'Pretoria Retail DC',
        receiverContact: '012 345 6789', receiverEmail: 'gareth@gmail.com',
        receiverAddress: { building: 'Unit 5, Block B', street: '102 Church St', township: 'Pretoria West', suburb: 'Pretoria West', city: 'Pretoria', province: 'Gauteng', postalCode: '0183', country: 'South Africa', countryCode: 'ZA' },
        billingSameAsReceiver: true, receivingHours: '08:00 - 16:00',
        serviceType: 'Road Freight', rateType: 'KG', charges: 'R1250.00',
        specialInstructions: 'Handle with care', quantity: 2,
        parcels: [
          { id: 'WB000001-01', weight: 15, length: 30, width: 25, height: 20, volumetricWeight: volWeight(30,25,20) },
          { id: 'WB000001-02', weight: 10, length: 20, width: 20, height: 15, volumetricWeight: volWeight(20,20,15) },
        ],
        status: 'Delivered',
      });

      // ── Waybill 2 ──
      const wb2 = await Waybill.create({
        waybillNo: 'WB000002', productCode: 'PC000002', date: new Date(),
        sender: alpha.name, pickupPoint: alpha.pickupPoints[0],
        senderContact: alpha.contact, senderEmail: alpha.email,
        senderAddress: alpha.address, senderWechat: alpha.wechat,
        extraCharges: 'None',
        receiver: 'Sarah Jenkins', deliveryPoint: 'Midrand Offices',
        receiverContact: '011 987 6543', receiverEmail: 'sarah@ops.co.za',
        receiverAddress: { building: 'Suite 201', street: '12 Old Pretoria Rd', township: 'Midrand', suburb: 'Halfway House', city: 'Johannesburg', province: 'Gauteng', postalCode: '1685', country: 'South Africa', countryCode: 'ZA' },
        billingSameAsReceiver: true, receivingHours: '08:00 - 17:00',
        serviceType: 'Express Courier', rateType: 'Flat Rate', charges: 'R450.00',
        specialInstructions: 'Deliver to reception', quantity: 1,
        parcels: [{ id: 'WB000002-01', weight: 5, length: 15, width: 15, height: 10, volumetricWeight: volWeight(15,15,10) }],
        status: 'Delivered',
      });

      // ── Waybill 3 ──
      const wb3 = await Waybill.create({
        waybillNo: 'WB000003', productCode: 'PC000003', date: new Date(),
        sender: metro.name, pickupPoint: metro.pickupPoints[0],
        senderContact: metro.contact, senderEmail: metro.email,
        senderAddress: metro.address, senderWechat: metro.wechat,
        extraCharges: 'R200.00',
        receiver: 'Devan Pillay', deliveryPoint: 'Durban Main Port',
        receiverContact: '031 654 3210', receiverEmail: 'devan@portlogistics.co.za',
        receiverAddress: { building: 'Warehouse A', street: '45 Point Road', township: 'Durban Port', suburb: 'Point', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001', country: 'South Africa', countryCode: 'ZA' },
        billingSameAsReceiver: true, receivingHours: '24 Hours',
        serviceType: 'Road Freight', rateType: 'CBM', charges: 'R3800.00',
        specialInstructions: 'Call before delivery', quantity: 3,
        parcels: [
          { id: 'WB000003-01', weight: 200, length: 120, width: 100, height: 160, volumetricWeight: volWeight(120,100,160) },
          { id: 'WB000003-02', weight: 150, length: 100, width: 100, height: 120, volumetricWeight: volWeight(100,100,120) },
          { id: 'WB000003-03', weight: 180, length: 110, width: 100, height: 140, volumetricWeight: volWeight(110,100,140) },
        ],
        status: 'Active',
      });

      // ── Waybill 4 ──
      const wb4 = await Waybill.create({
        waybillNo: 'WB000004', productCode: 'PC000004', date: new Date(),
        sender: metro.name, pickupPoint: metro.pickupPoints[0],
        senderContact: metro.contact, senderEmail: metro.email,
        senderAddress: metro.address, senderWechat: metro.wechat,
        extraCharges: 'None',
        receiver: 'Kwanele Khumalo', deliveryPoint: 'Umhlanga Offices',
        receiverContact: '031 111 2222', receiverEmail: 'kwanele@khumaloco.co.za',
        receiverAddress: { building: '1st Floor, Gateway Building', street: '1 Broad Ave', township: 'Umhlanga', suburb: 'Umhlanga Ridge', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4319', country: 'South Africa', countryCode: 'ZA' },
        billingSameAsReceiver: true, receivingHours: '08:30 - 16:30',
        serviceType: 'Express Courier', rateType: 'Flat Rate', charges: 'R350.00',
        specialInstructions: 'Secure delivery', quantity: 1,
        parcels: [{ id: 'WB000004-01', weight: 8, length: 25, width: 20, height: 15, volumetricWeight: volWeight(25,20,15) }],
        status: 'Outstanding',
      });

      // ── Waybill 5 ──
      const wb5 = await Waybill.create({
        waybillNo: 'WB000005', productCode: 'PC000005', date: new Date(),
        sender: build.name, pickupPoint: build.pickupPoints[0],
        senderContact: build.contact, senderEmail: build.email,
        senderAddress: build.address, senderWechat: build.wechat,
        extraCharges: 'R100.00',
        receiver: 'Johan Snyman', deliveryPoint: 'Epping DC',
        receiverContact: '021 777 8888', receiverEmail: 'johan@buildco.co.za',
        receiverAddress: { building: 'Yard 4', street: '88 Grenville Avenue', township: 'Epping Industrial', suburb: 'Epping', city: 'Cape Town', province: 'Western Cape', postalCode: '7460', country: 'South Africa', countryCode: 'ZA' },
        billingSameAsReceiver: true, receivingHours: '06:00 - 18:00',
        serviceType: 'Road Freight', rateType: 'KG', charges: 'R2100.00',
        specialInstructions: 'Bulk offload', quantity: 1,
        parcels: [{ id: 'WB000005-01', weight: 1200, length: 150, width: 120, height: 180, volumetricWeight: volWeight(150,120,180) }],
        status: 'Delivered',
      });

      // ── Waybill 6 ──
      const wb6 = await Waybill.create({
        waybillNo: 'WB000006', productCode: 'PC000006', date: new Date(),
        sender: metro.name, pickupPoint: metro.pickupPoints[0],
        senderContact: metro.contact, senderEmail: metro.email,
        senderAddress: metro.address, senderWechat: metro.wechat,
        extraCharges: 'R50.00',
        receiver: 'Tshepo Nkosi', deliveryPoint: 'Berea Depot',
        receiverContact: '031 303 4040', receiverEmail: 'tshepo@bereadist.co.za',
        receiverAddress: { building: 'Office 12', street: '210 Berea Rd', township: 'Berea', suburb: 'Berea', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001', country: 'South Africa', countryCode: 'ZA' },
        billingSameAsReceiver: true, receivingHours: '08:00 - 16:00',
        serviceType: 'Standard Cargo', rateType: 'Flat Rate', charges: 'R250.00',
        specialInstructions: 'Delivery failed: Recipient absent', quantity: 1,
        parcels: [{ id: 'WB000006-01', weight: 12, length: 30, width: 30, height: 20, volumetricWeight: volWeight(30,30,20) }],
        status: 'Failed',
      });

      // Update counters to current highest sequence
      await Counter.updateOne({ id: 'waybill'  }, { seq: 6 }, { upsert: true });
      await Counter.updateOne({ id: 'product'  }, { seq: 6 }, { upsert: true });

      // ── Manifests ──────────────────────────────────────────────────────────
      await Manifest.create({
        manifestNo: 'MF000001', date: new Date(),
        driver: 'John Dube', vehicle: 'CAA 125 GP', route: 'JHB - PTA',
        status: 'On Delivery',
        waybills: [wb1._id, wb2._id],
        totalParcels: 3, totalWeight: 30,
      });

      await Manifest.create({
        manifestNo: 'MF000002', date: new Date(),
        driver: 'Sipho Nkosi', vehicle: 'CAA 448 GP', route: 'JHB - DBN',
        status: 'On Delivery',
        waybills: [wb3._id, wb4._id, wb6._id],
        totalParcels: 5, totalWeight: 542,
      });

      await Manifest.create({
        manifestNo: 'MF000003', date: new Date(),
        driver: 'Pieter Botha', vehicle: 'CAA 706 GP', route: 'JHB - PE',
        status: 'On Delivery',
        waybills: [wb5._id],
        totalParcels: 1, totalWeight: 1200,
      });

      await Counter.updateOne({ id: 'manifest' }, { seq: 3 }, { upsert: true });

      console.log('[SEED] Waybills and manifests seeded successfully.');
    }

    console.log('[SEED] Database seed complete.');
  } catch (error) {
    console.error('[SEED] Error during seeding:', error);
  }
};

export default seedAdmin;
