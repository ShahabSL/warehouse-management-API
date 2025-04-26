-- Sample data for xicorana database
-- Ensure you run the schema.sql script first to create the tables.

-- IMPORTANT: This script provides sample data for testing and development.
-- It uses placeholder IDs and NON-SENSITIVE, FAKE information.
-- DO NOT use this data in a production environment.

-- Use the target database
USE `xicorana`;

-- --- Core Entities ---

-- Sample User(s)
-- Password for 'john_doe' is 'password123', hashed with SHA256
INSERT INTO `user` (`userId`, `username`, `password`, `fullName`, `workPlace`, `phoneNumber`, `userRole`) VALUES
('user-001', 'john_doe', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'John Doe', 'wp-001', '123-456-7890', 'Admin'),
('user-002', 'jane_smith', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Jane Smith', 'wp-002', '987-654-3210', 'Operator');

-- Sample Workplace(s)
INSERT INTO `workplace` (`wpId`, `wpName`, `wpType`, `wpAddress`, `wpPhoneNumber`, `userId`) VALUES
('wp-001', 'Main Warehouse', 'Warehouse', '123 Industrial Ave', '555-1111', 'user-001'),
('wp-002', 'Production Floor A', 'Production', '456 Factory St', '555-2222', 'user-002');

-- Sample Manufacturer(s)
INSERT INTO `manf` (`manfId`, `manfName`, `manfPhoneNumber`, `manfAddress`) VALUES
('manf-001', 'Reliable Materials Co.', '555-3333', '789 Supply Rd');

-- Sample Product(s)
INSERT INTO `product` (`prodId`, `prodName`, `prodGTIN`, `prodGauge`, `prodMaterial`, `prodInsul`, `prodPic`) VALUES
('prod-001', 'Standard Copper Wire 1.5mm', '1234567890123', 1.5, 'Copper', 'PVC', '/images/prod-001.jpg'),
('prod-002', 'Heavy Duty Aluminum Cable 6mm', '9876543210987', 6.0, 'Aluminum', 'XLPE', '/images/prod-002.jpg');

-- Sample High Demand Product(s)
INSERT INTO `highdemand` (`prodname`) VALUES
('Standard Copper Wire 1.5mm');

-- Sample Customer(s)
INSERT INTO `customer` (`custId`, `custName`, `custPhoto`, `custAddress`, `custEmail`, `custMPhone`, `custPhone`) VALUES
('cust-001', 'ACME Corp', '/images/cust-001.png', '1 Business Park', 'contact@acme.com', '555-8000', '555-8001');

-- --- Related Entities (Examples) ---

-- Sample Insulation Material(s)
INSERT INTO `insul` (`insId`, `insType`, `insCode`, `manfId`, `insEntryDate`, `insRecNum`, `insState`, `insEXP`, `insLoc`, `insColor`, `insCount`, `insQC`, `wpId`, `insLL`, `insSector`) VALUES
('ins-001', 'PVC Compound', 'PVC-RED-01', 'manf-001', '2024-01-15', 'REC-1001', 'Available', '2025-01-15', 'Shelf A1', 'Red', 500, 1, 'wp-001', 'Operator A', 'Insulation Storage');

-- Sample Order(s)
INSERT INTO `order` (`ordId`, `orderDate`, `custId`, `orderApproval`, `userId`, `orderSituation`) VALUES
('ord-001', NOW(), 'cust-001', 1, 'user-001', 'Pending');

-- Sample Contain (Order Items)
INSERT INTO `contain` (`contId`, `prodId`, `contCount`, `contSitu`, `userId`, `ordId`) VALUES
('cont-001', 'prod-001', 1000, 'Allocated', 'user-001', 'ord-001');

-- Sample Request(s)
INSERT INTO `request` (`reqId`, `reqDate`, `reqType`, `reqDetail`, `reqOk`, `reqSender`, `reqReciever`) VALUES
('req-001', NOW(), 'Material Transfer', 'Need 2 spools of prod-001 transferred to wp-002', 'pending', 'user-002', 'user-001');

-- --- Standalone Entities (Examples) ---

-- Sample QC Record(s)
INSERT INTO `qc` (`qcId`, `qcType`, `qcPath`, `qcDate`) VALUES
('qc-ins-001', 'Insulation QC', '/qc/reports/ins-001-report.pdf', NOW());

-- Sample Log Entry(s)
INSERT INTO `log` (`logId`, `logTimestamp`, `userId`, `logEvent`) VALUES
('log-001', NOW(), 'user-001', 'User login successful'),
('log-002', NOW(), 'user-002', 'Created request req-001');


-- Note: Sample data for `wirespool`, `productionplan`, `cart`, `finalproduct`, `sold_finalproduct`, and `transports`
-- are omitted due to their complex interdependencies. Creating meaningful sample data
-- for these often requires understanding the specific production workflow simulated by the application.
-- You can add simple entries manually if needed for basic testing.