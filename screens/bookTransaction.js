import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet, TextInput, Alert, Image, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import db from '../config.js'


export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookId: ' ',
      scannedStudentId: ' '
    }
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    });
  }

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state
    if (buttonState === 'BookId') {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal'
      })
    }
    else if (buttonState === 'StudentId') {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'
      })
    }
  }
  handleTransaction = () => {
    var transactionType = await this.checkBookEligibility()
    if (!transactionType) {
      Alert.alert("this book doesnot exsist in the library")
      this.setState({
        scannedStudentId: ' ',
        scannedBookId: ' '
      })
    }
    else if (transactionType === "Issue") {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
      if (isStudentEligible) {
        this.intiateBookIssue(
          Alert.alert("Book Issued To The Student")
        )
      }
      else {
        var isStudentEligible = await this.checkStudentEligibilityForBookReturn()
        if (isStudentEligible) {
          this.intiateBookReturn(
            Alert.alert("Book returned To The Library")
          )
        }
      }
    }
  }
  checkStudentEligibilityForBookIssue = async () => {
    const studentRef = await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get()
    var isStudentEligible = " "
    if (studentRef.docs.length === 0) {
      this.setState({
        scannedStudentId: ' ',
        scannedBookId: ' '
      })
      isStudentEligible = false;
      Alert.alert("StudentId doesnot Exsist ")
    }
    else{
      studentRef.docs.map((doc)=>{
        var student=doc.data()
        if (student.numberOfBooksIssued<=2){
          isStudentEligible=true;
        }
        else{
          isStudentEligible=false;
          Alert.alert("student has already issued two books")
          this.setState({
            scannedStudentId: ' ',
            scannedBookId: ' '
          })
        }
      })
    }
    return isStudentEligible
  }
  checkStudentEligibilityForBookReturn=async()=>{
    const transactionRef=await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
    var isStudentEligible=" "
    transactionRef.docs.map(( doc)=>{
      var lastBookTransaction=doc.data()
      if(lastBookTransaction.StudentId===this.state.scannedStudentId){
    isStudentEligible=true;

      }
      else{
        isStudentEligible=false;
        Alert.alert("this book was not issued by this student ")
        this.setState({
          scannedStudentId: ' ',
          scannedBookId: ' '
        })
      }
    })
    return isStudentEligible
  }
  checkBookEligibility=async()=>{
    const bookref=await db.collection ("books").where("bookId","==",this.state.scannedBookId).get()
     var transactionType = " "
     if(bookref.docs.length==0){
       transactionType=false
     }
     else{
       bookref.docs.map((doc)=>{
         var book =doc.data()
         if(book.bookAvalability){
           transactionType="Issue"
         }
         else{
           transactionType="Return"
         }
       })
     }
     return transactionType
  } 
  intiateBookIssue = async () => {
    db.collection("Transactions").add({
      'StudentId': this.state.scannedStudentId,
      'BookID': this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': 'Issue'
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvalability': false
    })
    db.collection("Students").doc(this.state.scannedStudentId).update({
      'no of booksIssued': firebase.firestore.FeildValue.increment(1)
    })
    Alert.alert("BOOK ISSUED")
    this.setState({
      scannedBookId: ' ',
      scannedStudentId: ' '

    })
  }
  intiateBookReturn = async () => {
    db.collection("Transactions").add({
      'StudentId': this.state.scannedStudentId,
      'BookID': this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': 'Return'
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvalability': true
    })
    db.collection("Students").doc(this.state.scannedStudentId).update({
      'no of booksIssued': firebase.firestore.FeildValue.increment(-1)
    })
    Alert.alert("BOOK RETURNED")
    this.setState({
      scannedBookId: ' ',
      scannedStudentId: ' '

    })
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal") {
      return (

        <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
          <View>
            <Image source={require('../assets/booklogo.jpg')} style={{ width: 200, height: 200 }} />
            <Text style={{ textAlign: 'center', fontSize: 30, fontStyle: 'neucha' }}>WILY</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput style={styles.inputbox} placeholder='book id'
              onTouchText={text => this.setState({
                scannedBookId: text
              })}
              value={this.state.scannedBookId}
            />
            <TouchableOpacity style={styles.scanButton} onPress={() => {
              this.getCameraPermissions("BookId")
            }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput style={styles.inputbox} placeholder='Student id'
              onChangeText={text => this.setState({
                scannedStudentId: text
              })}
              value={this.state.scannedStudentId}
            />
            <TouchableOpacity style={styles.scanButton} onPress={() => {
              this.getCameraPermissions("StudentId")
            }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={this.handleTransaction()}>
            <Text style={styles.sumbitButtonText} SUBMIT></Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10
  },
  inputView: {
    flexDirection: 'row',
    margin: 20
  },
  inputbox: {
    width: 200,
    height: 50,
    borderWidth: 1.5,
    fontSize: 20
  },
  submitButton: {
    backgroundColor: 'blue',
    width: 100,
    height: 50
  },
  sumbitButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 10,
    color: 'pink',
    textAlign: 'center'
  }
});