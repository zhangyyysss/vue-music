
// 将singer分装成一个类,我们可以设置我们想要的格式和数据,记得要结构变量{id, name},如果结构,那么就相当于把第一个参数id当成一个类,
// 导致id: {id: 4213123 name: 薛之谦} ,name: undefined,avatar: `http://......[object Obejct]/jpg....`
// 如果我们传入数据的时候也必须是下面这种形式 //
//          (new Singer({
//             id: item.Fsinger_mid,
//             name: item.Fsinger_name
//           }))
// 当然也可以是 不解构,使用 new Singer(item.Fsinger_mid,item.Fsinger_name),一个参数一个参数对应的传也可以,上面语义更加好~,建议使用上面的方法
export class Singer {
  constructor({id, name}) {
    this.id = id
    this.name = name
    this.avatar = `https://y.gtimg.cn/music/photo_new/T001R300x300M000${id}.jpg?max_age=2592000`
  }
}
