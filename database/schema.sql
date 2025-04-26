CREATE DATABASE  IF NOT EXISTS `xicorana` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `xicorana`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: xicorana
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `cartId` varchar(255) NOT NULL,
  `cartType` varchar(255) DEFAULT NULL,
  `cartDevice` varchar(255) DEFAULT NULL,
  `cartIn` varchar(255) DEFAULT NULL,
  `cartOut` varchar(255) DEFAULT NULL,
  `cartShift` varchar(255) DEFAULT NULL,
  `cartLenght` int DEFAULT NULL,
  `prodName` varchar(255) DEFAULT NULL,
  `ppId` varchar(255) DEFAULT NULL,
  `cartMFG` date DEFAULT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `cartColor` varchar(255) DEFAULT NULL,
  `insulId` varchar(255) DEFAULT NULL,
  `wireSpId` varchar(255) DEFAULT NULL,
  `wpId` varchar(255) DEFAULT NULL,
  `cartLL` varchar(45) DEFAULT 'نامشخص',
  `cartQc` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`cartId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contain`
--

DROP TABLE IF EXISTS `contain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contain` (
  `contId` varchar(255) NOT NULL,
  `prodId` varchar(255) DEFAULT NULL,
  `contCount` int DEFAULT NULL,
  `contSitu` varchar(255) DEFAULT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `ordId` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`contId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `custId` varchar(255) NOT NULL,
  `custName` varchar(255) DEFAULT NULL,
  `custPhoto` varchar(255) DEFAULT NULL,
  `custAdresse` varchar(255) DEFAULT NULL,
  `custEmail` varchar(255) DEFAULT NULL,
  `custMPhone` varchar(255) DEFAULT NULL,
  `custPhone` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`custId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `finalproduct`
--

DROP TABLE IF EXISTS `finalproduct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finalproduct` (
  `fpId` varchar(255) NOT NULL,
  `fpType` varchar(255) DEFAULT NULL,
  `fpCart` varchar(255) DEFAULT NULL,
  `uesrId` varchar(255) DEFAULT NULL,
  `fpEndUserCode` varchar(255) DEFAULT NULL,
  `fpLoc` varchar(255) DEFAULT NULL,
  `fpSituation` varchar(255) DEFAULT NULL,
  `wpId` varchar(255) DEFAULT NULL,
  `fpLL` varchar(255) DEFAULT NULL,
  `fpSector` varchar(45) DEFAULT 'not set',
  `fpWrapped` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`fpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `highdemand`
--

DROP TABLE IF EXISTS `highdemand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `highdemand` (
  `prodname` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insul`
--

DROP TABLE IF EXISTS `insul`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insul` (
  `insId` varchar(255) NOT NULL,
  `insType` varchar(255) DEFAULT NULL,
  `insCode` varchar(255) DEFAULT NULL,
  `manfId` varchar(255) DEFAULT NULL,
  `insEntryDate` varchar(255) DEFAULT NULL,
  `insRecNum` varchar(255) DEFAULT NULL,
  `insState` varchar(255) DEFAULT NULL,
  `insEXP` date DEFAULT NULL,
  `insLoc` varchar(255) DEFAULT NULL,
  `insColor` varchar(255) DEFAULT NULL,
  `insCount` int DEFAULT NULL,
  `insQC` tinyint(1) DEFAULT NULL,
  `wpId` varchar(255) DEFAULT NULL,
  `insLL` varchar(255) DEFAULT NULL,
  `insSector` varchar(45) DEFAULT 'no set',
  PRIMARY KEY (`insId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log`
--

DROP TABLE IF EXISTS `log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log` (
  `logId` varchar(255) NOT NULL,
  `logTimestamp` datetime DEFAULT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `logEvent` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manf`
--

DROP TABLE IF EXISTS `manf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manf` (
  `manfId` varchar(255) NOT NULL,
  `manfName` varchar(255) DEFAULT NULL,
  `manfPhoneNumber` varchar(255) DEFAULT NULL,
  `manfAddress` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`manfId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order` (
  `ordId` varchar(255) NOT NULL,
  `orderDate` datetime DEFAULT NULL,
  `custId` varchar(255) DEFAULT NULL,
  `orderApproval` tinyint(1) DEFAULT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `orderSituation` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ordId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `prodId` varchar(255) NOT NULL,
  `prodName` varchar(255) DEFAULT NULL,
  `prodGTIN` varchar(255) DEFAULT NULL,
  `prodGauge` double DEFAULT NULL,
  `prodMaterial` varchar(255) DEFAULT NULL,
  `prodInsul` varchar(255) DEFAULT NULL,
  `prodPic` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`prodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productionplan`
--

DROP TABLE IF EXISTS `productionplan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productionplan` (
  `ppId` varchar(255) NOT NULL,
  `ppMFG` date DEFAULT NULL,
  `ppDevice` varchar(255) DEFAULT NULL,
  `ppProductAmount` varchar(255) DEFAULT NULL,
  `ppLinearVel` varchar(255) DEFAULT NULL,
  `ppOverlap` varchar(255) DEFAULT NULL,
  `insId` varchar(255) DEFAULT NULL,
  `ppProdState` varchar(255) DEFAULT NULL,
  `ppLength` int DEFAULT NULL,
  `ppGauge` int DEFAULT NULL,
  `ppAnnealing` int DEFAULT NULL,
  `insType` varchar(255) DEFAULT NULL,
  `insColor` varchar(255) DEFAULT NULL,
  `ppSize` double DEFAULT NULL,
  `prodId` varchar(255) DEFAULT NULL,
  `ppOutGauge` int DEFAULT NULL,
  `ppArcLength` int DEFAULT NULL,
  `ppMaterialAmount` int DEFAULT NULL,
  `ppInSp` varchar(255) DEFAULT NULL,
  `ppOutSp` varchar(255) DEFAULT NULL,
  `ppUserId` varchar(255) DEFAULT NULL,
  `ppSituation` varchar(255) DEFAULT NULL,
  `ppDetail` longtext,
  `wspId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ppId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qc`
--

DROP TABLE IF EXISTS `qc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qc` (
  `qcId` varchar(255) NOT NULL,
  `qcType` varchar(255) DEFAULT NULL,
  `qcPath` longtext,
  `qcDate` datetime DEFAULT NULL,
  PRIMARY KEY (`qcId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `request`
--

DROP TABLE IF EXISTS `request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request` (
  `reqId` varchar(255) NOT NULL,
  `reqDate` datetime DEFAULT NULL,
  `reqType` varchar(255) DEFAULT NULL,
  `reqDetail` longtext,
  `reqOk` varchar(10) DEFAULT 'pending',
  `reqSender` varchar(255) DEFAULT NULL,
  `reqReciever` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`reqId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sold_finalproduct`
--

DROP TABLE IF EXISTS `sold_finalproduct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sold_finalproduct` (
  `fpId` varchar(255) NOT NULL,
  `fpType` int DEFAULT NULL,
  `fpCart` varchar(255) DEFAULT NULL,
  `fpUesrId` varchar(255) DEFAULT NULL,
  `fpEndUserCode` varchar(255) DEFAULT NULL,
  `fpLoc` varchar(255) DEFAULT NULL,
  `fpWrapped` varchar(255) DEFAULT NULL,
  `fpSituation` varchar(255) DEFAULT NULL,
  `orderId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`fpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transports`
--

DROP TABLE IF EXISTS `transports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transports` (
  `tpId` varchar(255) NOT NULL,
  `orderId` varchar(20) NOT NULL,
  `tpDriverDetail` varchar(255) NOT NULL,
  `tpDriverId` varchar(255) DEFAULT 'driver',
  `tpSituation` varchar(255) NOT NULL,
  `custAddress` varchar(255) NOT NULL,
  `tpDate` date NOT NULL,
  PRIMARY KEY (`tpId`),
  UNIQUE KEY `tpId_UNIQUE` (`tpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userId` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullName` varchar(255) DEFAULT NULL,
  `workPlace` varchar(255) DEFAULT NULL,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `userRole` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wirespool`
--

DROP TABLE IF EXISTS `wirespool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wirespool` (
  `wspId` varchar(255) NOT NULL,
  `wspDirection` varchar(255) DEFAULT NULL,
  `wspMaterial` varchar(255) DEFAULT NULL,
  `wspType` double DEFAULT NULL,
  `wspPp` varchar(255) DEFAULT NULL,
  `wspState` varchar(255) DEFAULT NULL,
  `wspDate` date DEFAULT NULL,
  `wspIn` varchar(255) DEFAULT NULL,
  `wspOut` varchar(255) DEFAULT NULL,
  `wspLength` int DEFAULT NULL,
  `wspWempty` int DEFAULT NULL,
  `wspWfull` int DEFAULT NULL,
  `wspWpure` int DEFAULT NULL,
  `wspQC` tinyint(1) DEFAULT NULL,
  `wpId` varchar(255) DEFAULT NULL,
  `wspLL` varchar(255) DEFAULT NULL,
  `wspSector` varchar(45) DEFAULT 'not set',
  `wspBj` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`wspId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workplace`
--

DROP TABLE IF EXISTS `workplace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workplace` (
  `wpId` varchar(255) NOT NULL,
  `wpName` varchar(255) DEFAULT NULL,
  `wpType` varchar(255) DEFAULT NULL,
  `wpAddress` varchar(255) DEFAULT NULL,
  `wpPhoneNumber` varchar(255) DEFAULT NULL,
  `userId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`wpId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-25 21:52:45
