import React, { useState,useEffect,useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Box from '@material-ui/core/Box'
import Title from './Title';
import { createMuiTheme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';
import {Link} from '@reach/router';
import {CheckRequests, GetTeacherInfo, GetExamDetails, AcceptOrDenyRequest} from '../firebase';
import { UserContext } from "../providers/UserProvider";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import firebase from "firebase/app";

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});
  
const useStyles = makeStyles((theme) => ({
  seeMore: {
    marginTop: theme.spacing(1),
  },
  addExam: {
    marginTop: theme.spacing(1),
  },
}));

export default function PendingRequest() {
  const userDetails = useContext(UserContext);
  let {uid} = userDetails;

  const [teacherName, setTeacherName] = useState([]);
  const classes = useStyles(theme);
  const [requestList, setRequestList] = useState([]);
  const [examName, setExamName] = useState([]);

  useEffect(() => {
    const HandleList = (temp, temp1, temp2) => {
      setRequestList(temp);
      setTeacherName(temp1);
      setExamName(temp2);
      //console.log(requestList);
      //console.log(teacherName);
      //console.log(examName);
    }
    const DisplayDetails = async () => {
      //console.log(details);
      let requests = await CheckRequests(uid);
      requestList.push(...requests);
      for(let i=0;i<requestList.length;i++){
        let details = await GetTeacherInfo(requestList[i].from);
        let examDetails = await GetExamDetails(requestList[i].exam);
        examName.push(examDetails.data().course['name']);
        teacherName.push(details.data().name);
      }
      HandleList(requestList, teacherName, examName);
    }
    DisplayDetails();
  },[requestList,uid,teacherName,examName]);

  const handleAccept = async(requestID,index) => {
    //console.log("accept", requestID);
    requestList.splice(index,1);
    setRequestList(requestList);
    //console.log(requestList);
    let ret = await AcceptOrDenyRequest(1,requestID);
    if(ret.type === 1 || ret.type === 2){
      if(ret.type === 1){
        console.log("accepted");
        sendCNFMail(ret.mail, ret.date, "ACCEPTED")
      }
      else{
        console.log("denied");
      }
    }
    else if(ret.type === 3){
      console.log("Same slot accessed recently");
    }
  }

  const sendCNFMail = (emailList, dates, stat) => {
    let addMessage = firebase.functions().httpsCallable('responseEmail');
    addMessage({ 
      toEmail : emailList, // array of string or single string
      date : dates, // string
      status : stat,
     })
    .then((result) => {
      console.log("Done Email")
      // Read result of the Cloud Function.
    });
  };

  const handleRejection = async(requestID,index) => {
    //console.log("Reject", requestID);
    requestList.splice(index,1);
    setRequestList(requestList);
    //console.log(requestList);
    let ret = await AcceptOrDenyRequest(0,requestID);
    if(ret.type === 1 || ret.type === 2){
      if(ret.type === 1){
        console.log("accepted");
        sendCNFMail(ret.mail, ret.date, "DENIED")
      }
      else{
        console.log("denied");
      }
    }
    else{
      console.log("accpeted recently");
    }
  }

return (
    <React.Fragment>
      <div>       
      <Title>Requests</Title> 
      <Link to = "/pendingRequest" style={{ textDecoration: 'none', color: "white" }}>
          <IconButton><RefreshIcon/></IconButton>
      </Link>
      </div>
      <div>
      <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><b>Request From</b></TableCell>
              <TableCell><b>Date-Slot</b></TableCell>
              <TableCell><b>Exam</b></TableCell>
              <TableCell><b>Action</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {(requestList).map((requestDetail, index) => (
              <TableRow key={requestDetail.requestID}>
              <TableCell>{teacherName[index]}</TableCell>
              <TableCell>{requestDetail.dateSlot}</TableCell>
              <TableCell>{examName[index]}</TableCell>
              <TableCell>
                <Link to="/pendingRequest">
                <IconButton onClick={() => handleAccept(requestDetail.requestID, index)} style={{ color: "green" }}><CheckCircleIcon/></IconButton>
                <IconButton onClick={() => handleRejection(requestDetail.requestID, index)} style={{ color: "red" }}><CancelIcon/></IconButton>
                </Link> 
              </TableCell>
              </TableRow>
          ))}
          </TableBody>
      </Table>
      </div>
      <Box flex={1}/>
      <div className={classes.extra}>
      <div className={classes.addExam}>
      </div>
      </div>
      </React.Fragment>
    );
}