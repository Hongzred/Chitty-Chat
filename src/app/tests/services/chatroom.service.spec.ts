import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/firestore';
import { ChatroomService } from '../../services/chatroom.service';
import { Observable } from 'rxjs';
import { firestore } from 'firebase';

describe('ChatroomService.getUpdates()', () => {
  const CHATROOM_ID = 'chatroomID';
  const COLLECTION_PATH = `chatrooms/${CHATROOM_ID}/chats`;
  const STATE_CHANGES = ['added'];
  const obs = new Observable((subscriber) => {
    subscriber.next([createMessageWithSeconds(10), createMessageWithSeconds(5)]);
  });

  let serviceUnderTest: ChatroomService;
  let firestoreServiceSpy: jasmine.SpyObj<AngularFirestore>;
  let mockCollection: jasmine.SpyObj<any>;

  firestoreServiceSpy = jasmine.createSpyObj('FirestoreService', ['collection']);
  mockCollection = jasmine.createSpyObj('MockCollection', ['stateChanges']);

  firestoreServiceSpy
    .collection.withArgs(jasmine.any(String))
    .and.returnValue(mockCollection);
  mockCollection
    .stateChanges.withArgs(jasmine.any(Array))
    .and.returnValue(obs);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
          ChatroomService,
          { provide: AngularFirestore, useValue: firestoreServiceSpy }
      ]
    });
  });

  it('getUpdates() SHOULD return messages sorted by timestamp IF valid input', () => {
    serviceUnderTest = TestBed.get(ChatroomService);
    serviceUnderTest.getUpdates(CHATROOM_ID).subscribe({
      next(msg) {
        expect(msg[0].when.seconds < msg[1].when.seconds);
      }
    });
    expect(firestoreServiceSpy.collection).toHaveBeenCalledWith(COLLECTION_PATH);
    expect(mockCollection.stateChanges).toHaveBeenCalledWith(STATE_CHANGES);
  });

  function createMessageWithSeconds(seconds: number) {
    return {
      payload: {
        doc: {
          data() {
            return {
              content: 'sample content',
              when: {seconds}
            };
          },
          id: 'messageID'
        }
      }
    };
  }

});

describe('ChatroomService.getChatroomList()', () => {

  let serviceUnderTest: ChatroomService;
  const mockReturn = [{
    payload: {
      doc: {
        data() {
          return {data: 'mock data'};
        },
        id: 'mock id'
      }
    }
  }];

  const mockCollection = jasmine.createSpyObj({
    snapshotChanges: new Observable((subscriber) => subscriber.next(mockReturn))
  });

  const firestoreServiceSpy = jasmine.createSpyObj('AngularFirestore', {
    collection: mockCollection
  });

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        ChatroomService,
        { provide: AngularFirestore, useValue: firestoreServiceSpy}
      ]
    });

  });

  it('getChatroomList() should return an observable ', () => {
    serviceUnderTest = TestBed.get(ChatroomService);

    let respond;
    serviceUnderTest.getChatroomList().subscribe(res => {
      respond = res;
    });

    expect(respond[0].id).toEqual('mock id');
    expect(respond[0].data).toEqual('mock data');

    expect(mockCollection.snapshotChanges).toHaveBeenCalled();
    expect(firestoreServiceSpy.collection).toHaveBeenCalledWith('chatrooms');
  });

});


describe('ChatroomService.getChatHistory()', () => {

  let serviceUnderTest: ChatroomService;
  const mockReturn = [{
    payload: {
      doc: {
        data() {
          return {data: 'mock data'};
        },
        id: 'mock id'
      }
    }
  }];

  const mockCollection = jasmine.createSpyObj({
    snapshotChanges: new Observable((subscriber) => subscriber.next(mockReturn))
  });

  const firestoreServiceSpy = jasmine.createSpyObj('AngularFirestore', {
    collection: mockCollection
  });

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        ChatroomService,
        { provide: AngularFirestore, useValue: firestoreServiceSpy},
      ]
    });

  });

  it('getChatHistory() should return an observable ', () => {
    serviceUnderTest = TestBed.get(ChatroomService);

    let respond;
    serviceUnderTest.getChatHistory('fake roomId').subscribe(res => {
      respond = res;
    });

    expect(respond[0].id).toEqual('mock id');
    expect(respond[0].data).toEqual('mock data');

    expect(mockCollection.snapshotChanges).toHaveBeenCalled();
    expect(firestoreServiceSpy.collection).toHaveBeenCalledWith('chatrooms/fake roomId/chats');
  });

});


describe('ChatroomService.addNewChatroom()', () => {

  let serviceUnderTest: ChatroomService;
  let mockObject: jasmine.SpyObj<any>;
  let firestoreServiceSpy: any;
  const status = 'public';
  const userList = ['user1', 'user2'];
  const roomName = 'chitty-chat';
  const ownerID = 'owner id';

  beforeEach(() => {

    mockObject = jasmine.createSpyObj(
      'MockReturnObject',
      ['doc', 'set']);

    mockObject.doc.and.returnValue(mockObject);

    firestoreServiceSpy = jasmine.createSpyObj(
      'FirestoreService',
      ['collection', 'createId']);
    firestoreServiceSpy
      .collection.and.callFake(() => mockObject);

    TestBed.configureTestingModule({
      providers: [
        ChatroomService,
        { provide: AngularFirestore, useValue: firestoreServiceSpy}
      ]
    });

  });

  it('addNewChatroom() SHOULD return IF valid input ', () => {

    const RESOVLED_PROMISE = Promise.resolve('resolved').then((message) => {
      expect(message).toEqual('resolved');
    });
    mockObject.set.and.returnValue(RESOVLED_PROMISE);

    serviceUnderTest = TestBed.get(ChatroomService);
    serviceUnderTest.addNewChatroom(status, roomName, userList, ownerID);

    expect(firestoreServiceSpy.collection).toHaveBeenCalled();
    expect(mockObject.doc).toHaveBeenCalled();
    expect(mockObject.set).toHaveBeenCalled();
  });

  it('addNewChatroom() SHOULD catch IF invalid input ', () => {

    const REJECTED_PROMISE = Promise.reject(new Error('error')).catch((error) => {
      expect(error.message).toEqual('error');
    });
    mockObject.set.and.returnValue(REJECTED_PROMISE);

    serviceUnderTest = TestBed.get(ChatroomService);
    serviceUnderTest.addNewChatroom(status, roomName, userList, ownerID);

    expect(firestoreServiceSpy.collection).toHaveBeenCalled();
    expect(mockObject.doc).toHaveBeenCalled();
    expect(mockObject.set).toHaveBeenCalled();

  });

});

describe('ChatroomService.addUserToChatroom()', () => {
  const USER_ID = 'userID';
  const CHATROOM_ID = 'chatroomID';
  const MEMBERS = ['userID1', 'userID2'];
  const RESOVLED_PROMISE = Promise.resolve();

  let serviceUnderTest: ChatroomService;
  let firestoreServiceSpy: jasmine.SpyObj<any>;
  let fieldValueSpy: jasmine.SpyObj<any>;
  let mockObject: jasmine.SpyObj<any>;
  let mockDocumentReference: jasmine.SpyObj<firestore.DocumentReference>;

  beforeEach(() => {
    mockDocumentReference = jasmine.createSpyObj('MockDocumentReference', ['']);

    mockObject = jasmine.createSpyObj(
      'MockReturnObject',
      ['batch', 'update', 'commit']);
    mockObject.batch.and.returnValue(mockObject);
    mockObject.update.withArgs(jasmine.anything(), jasmine.anything()).and.returnValue(mockObject);
    mockObject.commit.and.returnValue(RESOVLED_PROMISE);
    mockObject.ref = mockDocumentReference;

    firestoreServiceSpy = jasmine.createSpyObj('FirestoreService', ['doc']);
    firestoreServiceSpy.doc.withArgs(jasmine.any(String)).and.returnValue(mockObject);
    firestoreServiceSpy.firestore = mockObject;

    fieldValueSpy = jasmine.createSpyObj('firebaseFirestoreFieldValue', ['arrayUnion']);
    fieldValueSpy.arrayUnion.withArgs(jasmine.anything)
      .and.returnValues(MEMBERS, [mockDocumentReference, mockDocumentReference]);

    TestBed.configureTestingModule({
      providers: [
        ChatroomService,
        { provide: AngularFirestore, useValue: firestoreServiceSpy},
        { provide: firestore.FieldValue, useValue: fieldValueSpy }
      ]
    });

  });

  it('calling addUserToChatroom() should return IF valid input', () => {
    serviceUnderTest = TestBed.get(ChatroomService);

    const returnedPromise = serviceUnderTest.addUserToChatroom(USER_ID, CHATROOM_ID);

    expect(returnedPromise).toEqual(returnedPromise);
    expect(mockObject.update).toHaveBeenCalledTimes(2);
  });
});

describe('ChatroomService.deleteChatroom()', () => {
  const CHATROOM_ID = 'chatroomID';
  const RESOVLED_PROMISE = Promise.resolve();
  const REJECT_PROMISE = Promise.resolve();

  let serviceUnderTest: ChatroomService;
  let firestoreServiceSpy: jasmine.SpyObj<any>;
  let mockDocumentReference: jasmine.SpyObj<any>;
  let fieldValueSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockDocumentReference = jasmine.createSpyObj('MockDocumentReference', ['collection', 'get', 'delete', 'where']);
    mockDocumentReference.collection.withArgs(jasmine.any(String)).and.returnValue(mockDocumentReference);
    mockDocumentReference.where.withArgs(jasmine.any(String)).and.returnValue(mockDocumentReference);
    firestoreServiceSpy = jasmine.createSpyObj('FirestoreService', ['doc', 'delete', 'batch', 'ref', 'commit']);
    firestoreServiceSpy.doc.withArgs(jasmine.any(String)).and.returnValue(firestoreServiceSpy);
    firestoreServiceSpy.ref = mockDocumentReference;
    firestoreServiceSpy.batch.and.returnValue(firestoreServiceSpy);
    fieldValueSpy = jasmine.createSpyObj('firebaseFirestoreFieldValue', ['arrayRemove']);
    fieldValueSpy.arrayRemove.withArgs(jasmine.anything);

    TestBed.configureTestingModule({
      providers: [
        ChatroomService,
        { provide: AngularFirestore, useValue: firestoreServiceSpy},
        { provide: firestore.FieldValue, useValue: fieldValueSpy }
      ]
    });

  });

  it('calling deleteChatroom() should return IF valid input', () => {
    serviceUnderTest = TestBed.get(ChatroomService);
    spyOn(serviceUnderTest, 'delChatroomRefInUsers');
    mockDocumentReference.get.and.returnValue(RESOVLED_PROMISE);
    serviceUnderTest.deleteChatroom(CHATROOM_ID)
    .then(res => {
      expect(res).toEqual('success!');

      expect(firestoreServiceSpy.batch).toHaveBeenCalledTimes(2);
      expect(firestoreServiceSpy.delete).toHaveBeenCalled();
      expect(firestoreServiceSpy.commit).toHaveBeenCalledTimes(2);
      expect(firestoreServiceSpy.collection).toHaveBeenCalled();
      expect(firestoreServiceSpy.update).toHaveBeenCalled();
      expect(mockDocumentReference.delete).toHaveBeenCalled();
      expect(mockDocumentReference.where).toHaveBeenCalled();
      expect(fieldValueSpy.arrayRemove).toHaveBeenCalled();
      expect(serviceUnderTest.delChatroomRefInUsers).toHaveBeenCalled();
    });
  });

  it('calling deleteChatroom() should reject IF invalid input', () => {
    serviceUnderTest = TestBed.get(ChatroomService);
    mockDocumentReference.get.and.returnValue(REJECT_PROMISE);
    serviceUnderTest.deleteChatroom(CHATROOM_ID)
    .catch(e => {
      expect(e).toEqual('failed!');
    });
  });
});
