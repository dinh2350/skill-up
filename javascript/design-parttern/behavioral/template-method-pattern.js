/**
 * Template Method Pattern
 *
 * The Template Method Pattern is a behavioral pattern that defines the skeleton of an algorithm in the superclass but lets subclasses override specific steps of the algorithm without changing its structure.
 */

class DataMiner {
  mine(path) {
    this.openFile(path);
    this.extractData();
    this.parseData();
    this.closeFile();
  }

  openFile(path) {
    console.log(`Opening file at ${path}`);
  }

  extractData() {
    throw new Error("This method must be overwritten!");
  }

  parseData() {
    throw new Error("This method must be overwritten!");
  }

  closeFile() {
    console.log("Closing file");
  }
}

class PDFMiner extends DataMiner {
  extractData() {
    console.log("Extracting data from PDF");
  }

  parseData() {
    console.log("Parsing data from PDF");
  }
}

class CSVMiner extends DataMiner {
  extractData() {
    console.log("Extracting data from CSV");
  }

  parseData() {
    console.log("Parsing data from CSV");
  }
}

// Usage
const pdfMiner = new PDFMiner();
pdfMiner.mine("document.pdf");
// Output:
// Opening file at document.pdf
// Extracting data from PDF
// Parsing data from PDF
// Closing file

const csvMiner = new CSVMiner();
csvMiner.mine("data.csv");
// Output:
// Opening file at data.csv
// Extracting data from CSV
// Parsing data from CSV
// Closing file
