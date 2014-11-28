package controllers

import play.api._
import play.api.libs._
import play.api.libs.iteratee._
import play.api.libs.json._
import play.api.mvc._

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  val (events, channel) = Concurrent.broadcast[JsValue]

  // YOLO
  val lastSeen = collection.mutable.Map.empty[String, Any]

  def push[A: Writes](key: String, value: A) {
    channel.push(Json.obj(key -> value))
    lastSeen += (key -> value.toString)
  }

  def light(state: Int) = Action {
    push("light", state == 1)
    Ok
  }

  def humidity(value: Int) = Action {
    // Assuming that value range is from 0 -> 100
    push("humidity", value.toDouble / 100.0)
    Ok
  }

  def temperature(value: Int) = Action {
    push("temperature", value)
    Ok
  }

  def sound(value: Int) = Action {
    push("sound", value)
    Ok
  }

  def touch() = Action {
    push("touch", true)
    Ok
  }

  def stream = Action {
    Ok.chunked(
      events &> EventSource()
    ).withHeaders("Access-Control-Allow-Origin" -> "*") as "text/event-stream"
  }

  def get(key: String) = Action {
    lastSeen get key match {
      case Some("true")  => Ok("1")
      case Some("false") => Ok("0")
      case Some(v)     => Ok(v.toString)
      case None        => NotFound
    }
  }
}
