import ExpoModulesCore
import ActivityKit

// MUST exactly match the RestTimerAttributes struct in
// targets/rest-timer/RestTimerWidget.swift.
struct RestTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var endAt: Date
    }
    var exerciseName: String
}

public class RestActivityModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RestActivity")

        AsyncFunction("startRestActivity") { (exerciseName: String, endAtMs: Double) -> Bool in
            guard #available(iOS 16.2, *) else { return false }
            let attributes = RestTimerAttributes(exerciseName: exerciseName)
            let state = RestTimerAttributes.ContentState(endAt: Date(timeIntervalSince1970: endAtMs / 1000))
            let content = ActivityContent(state: state, staleDate: nil)
            do {
                _ = try Activity.request(attributes: attributes, content: content)
                return true
            } catch {
                return false
            }
        }

        Function("updateRestActivity") { (endAtMs: Double) -> Void in
            guard #available(iOS 16.2, *) else { return }
            let state = RestTimerAttributes.ContentState(endAt: Date(timeIntervalSince1970: endAtMs / 1000))
            Task {
                for activity in Activity<RestTimerAttributes>.activities {
                    await activity.update(using: state)
                }
            }
        }

        Function("endRestActivity") { () -> Void in
            guard #available(iOS 16.2, *) else { return }
            Task {
                for activity in Activity<RestTimerAttributes>.activities {
                    await activity.end(nil, dismissalPolicy: .immediate)
                }
            }
        }
    }
}
