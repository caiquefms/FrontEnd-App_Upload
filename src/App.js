import React,{Component} from 'react';
import {uniqueId} from 'lodash';
import filesize from 'filesize';

import Api from '../src/services/api';

import GlobalStyle from './components/styles/global';
import {Container,Content} from './styles';
import Upload from './components/upload'
import FileList from './components/FileList';

class App extends Component{
  state = {
    uploadedFiles:[],
  };

  async componentDidMount(){
    const response = await Api.get('posts');

    this.setState({uploadedFiles:response.data.map(file=>({
        id:file._id,
        name:file.name,
        readableSize:filesize(file.size),
        preview:file.url,
        uploaded:true,
        url:file.url
      }))
    });
  }

  componentWillUnmount(){
    this.state.uploadedFiles.forEach(file=>URL.revokeObjectURL(file.preview));
  }

  handleDelete = async id =>{
    await Api.delete(`posts/${id}`);
    this.setState({
      uploadedFiles:this.state.uploadedFiles.filter(file=>file.id != id)
    });
  }

  handleUpload = files =>{
    const uploadedFiles = files.map(file=>({
      file,
      id:uniqueId(),
      name:file.name,
      readableSize:filesize(file.size),
      preview:URL.createObjectURL(file),
      progress:0,
      uploaded:false,
      error:false,
      url:null
    }));
    
    this.setState({uploadedFiles: this.state.uploadedFiles.concat(uploadedFiles)});
    uploadedFiles.forEach(this.processUpload)
  };

  updateFile = (id,data)=>{
    this.setState({uploadedFiles:this.state.uploadedFiles.map(uploadedFile=>{
      return id === uploadedFile.id
      ? {...uploadedFile, ...data}
      :uploadedFile;
    })});
  }

  processUpload = (uploadedFile)=>{
    const data = new FormData();
    data.append('file',uploadedFile.file,uploadedFile.name);
    Api.post('posts',data,{
      onUploadProgress:e=>{
        const progress = parseInt(Math.round((e.loaded*100)/e.total));
        this.updateFile(uploadedFile.id,{progress});
      }
    }).then((response)=>{
      this.updateFile(uploadedFile.id,{
        uploaded:true,
        id:response.data._id,
        url:response.data.url
      })
    }).catch(()=>{
      this.updateFile(uploadedFile.id,{
        error:true
      });
    });

  }
  render(){
    const {uploadedFiles} = this.state;
    return (
      <Container>
        <Content>
          <Upload onUpload={this.handleUpload} />
          { !!uploadedFiles.length && (
             <FileList files={uploadedFiles} onDelete={this.handleDelete}/>)
          }
        </Content>
        <GlobalStyle/>
      </Container>
    )
  }
}

export default App;
